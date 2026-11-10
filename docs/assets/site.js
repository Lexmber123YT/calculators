/* ClearDayTrackers free calculators: shared form wiring. No outside scripts, no tracking, no cookies.

   A calculator module (assets/calcs/<slug>.js) registers itself as CDT_CALCS[slug] = { fields, compute }.
   fields: [{ name, label, min, max, allowZero, optional, integer, choices }]
     - number fields: blank, text, negative and (unless allowZero) zero are refused with a plain message
     - choices: a list of allowed string values (for <select>), passed to compute as the string
     - optional: blank becomes the field's `fallback` (default 0)
   compute(values) returns { out: { key: number|string }, flags: [{ level: "warn"|"good", text }] }
     or { error: "plain message" }.
   The page: <form class="calc" data-calc="<slug>"> with inputs named after the fields,
   result spots <b data-out="key" data-format="money|money0|pct|num|num1|hours|text">, a .results box,
   a .calc-msg box and a .flags box. */
(function (root) {
  "use strict";

  function parseField(raw, spec) {
    var label = spec.label || spec.name;
    if (spec.choices) {
      if (spec.choices.indexOf(raw) === -1) return { error: "Pick an option for " + label + "." };
      return { value: raw };
    }
    var s = raw == null ? "" : String(raw).trim().replace(/[$,%\s]/g, "");
    if (s === "") {
      if (spec.optional) return { value: spec.fallback == null ? 0 : spec.fallback };
      return { error: "Enter a number for " + label + "." };
    }
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return { error: label + " needs a plain number (like 25 or 12.5)." };
    var v = Number(s);
    if (!isFinite(v)) return { error: label + " needs a plain number." };
    var min = spec.min == null ? 0 : spec.min;
    if (v < min) return { error: label + (min === 0 ? " can't be negative." : " must be at least " + min + ".") };
    if (v === 0 && !spec.allowZero && min >= 0) return { error: label + " must be more than 0." };
    if (spec.max != null && v > spec.max) return { error: label + " must be " + spec.max + " or less." };
    if (spec.integer && Math.floor(v) !== v) return { error: label + " must be a whole number." };
    return { value: v };
  }

  function validate(calc, raw) {
    var values = {}, i, r;
    for (i = 0; i < calc.fields.length; i++) {
      r = parseField(raw[calc.fields[i].name], calc.fields[i]);
      if (r.error) return { error: r.error, field: calc.fields[i].name };
      values[calc.fields[i].name] = r.value;
    }
    return { values: values };
  }

  // Run validation + compute, and refuse any answer that isn't a real finite number.
  function run(calc, raw) {
    var v = validate(calc, raw);
    if (v.error) return v;
    var res = calc.compute(v.values);
    if (!res || res.error) return { error: (res && res.error) || "Those numbers don't work together. Check them and try again." };
    for (var k in res.out) {
      if (typeof res.out[k] === "number" && !isFinite(res.out[k]))
        return { error: "Those numbers don't work together. Check them and try again." };
    }
    res.flags = res.flags || [];
    return res;
  }

  function fmt(v, f) {
    if (typeof v === "string" || f === "text") return String(v);
    var neg = v < 0, a = Math.abs(v), s;
    switch (f) {
      case "money0": s = "$" + Math.round(a).toLocaleString("en-US"); break;
      case "pct": s = (a * 100).toFixed(1) + "%"; break;
      case "num": s = Math.round(a).toLocaleString("en-US"); break;
      case "num1": s = a.toLocaleString("en-US", { maximumFractionDigits: 1 }); break;
      case "hours": s = a.toLocaleString("en-US", { maximumFractionDigits: 1 }) + " hrs"; break;
      default: s = "$" + a.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return (neg ? "-" : "") + s;
  }

  function wire(form) {
    var calc = (root.CDT_CALCS || {})[form.getAttribute("data-calc")];
    if (!calc) return;
    var msg = form.querySelector(".calc-msg"), box = form.querySelector(".results"), flags = form.querySelector(".flags");
    // Look boxes up by name with a selector: form.elements["length"] would return the box COUNT, not the box.
    function box_(name) { return form.querySelector('[name="' + name + '"]'); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var raw = {}, i, el;
      for (i = 0; i < calc.fields.length; i++) {
        el = box_(calc.fields[i].name);
        raw[calc.fields[i].name] = el ? el.value : "";
      }
      var bad = form.querySelectorAll(".field.bad");
      for (i = 0; i < bad.length; i++) bad[i].classList.remove("bad");
      var res = run(calc, raw);
      if (res.error) {
        msg.textContent = res.error;
        msg.classList.add("show");
        box.classList.remove("show");
        if (res.field && box_(res.field)) {
          var f = box_(res.field).closest(".field");
          if (f) f.classList.add("bad");
          box_(res.field).focus();
        }
        return;
      }
      msg.classList.remove("show");
      var outs = form.querySelectorAll("[data-out]");
      for (i = 0; i < outs.length; i++) {
        var key = outs[i].getAttribute("data-out");
        if (key in res.out) outs[i].textContent = fmt(res.out[key], outs[i].getAttribute("data-format"));
      }
      if (flags) {
        flags.innerHTML = "";
        res.flags.forEach(function (fl) {
          var p = document.createElement("p");
          p.className = "flag " + (fl.level || "");
          p.textContent = fl.text;
          flags.appendChild(p);
        });
      }
      box.classList.add("show");
    });
    // Show the answer for the example numbers straight away, so a visitor sees what the page does.
    if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event("submit", { cancelable: true }));
  }

  var api = { parseField: parseField, validate: validate, run: run, fmt: fmt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else {
    root.CDT = api;
    document.addEventListener("DOMContentLoaded", function () {
      var forms = document.querySelectorAll("form.calc[data-calc]");
      for (var i = 0; i < forms.length; i++) wire(forms[i]);
    });
  }
})(typeof window !== "undefined" ? window : this);
