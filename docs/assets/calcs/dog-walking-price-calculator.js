/* Dog walking price and real pay per hour. Same math as the Pet Sitter Rate Increase & Price Sheet Kit
   (Start Here settings + Pay Per Visit Check, one service row). Held at the kit's default: new prices round to the
   nearest $0.50 (the price that reaches your target rounds UP to $0.50). */
(function (root) {
  "use strict";
  var STEP = 0.5;
  function r6(x) { return Math.round(x * 1e6) / 1e6; }
  function rnd(x) { return Math.round(r6(x / STEP)) * STEP; }
  function upr(x) { return Math.ceil(r6(x / STEP) - 1e-9) * STEP; }
  function m2(x) { return "$" + (Math.round(x * 100 + 1e-7) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  (root.CDT_CALCS = root.CDT_CALCS || {})["dog-walking-price-calculator"] = {
    fields: [
      { name: "price", label: "Price you charge now", min: 0, max: 10000 },
      { name: "minutes", label: "Minutes on the job", min: 0, max: 1440 },
      { name: "miles", label: "Round-trip miles", min: 0, allowZero: true, max: 300 },
      { name: "admin", label: "Admin minutes", min: 0, allowZero: true, max: 600 },
      { name: "supplies", label: "Supplies per visit", min: 0, allowZero: true, max: 1000 },
      { name: "target", label: "Pay you want per hour", min: 0, max: 500 },
      { name: "mph", label: "Average driving speed", min: 0, max: 100 },
      { name: "gas", label: "Gas and wear per mile", min: 0, allowZero: true, max: 10 },
      { name: "raise", label: "Raise you're thinking about", min: 0, allowZero: true, max: 100 }
    ],
    compute: function (v) {
      var mins = v.minutes + v.admin + (v.miles > 0 ? v.miles / v.mph * 60 : 0);
      var costs = v.supplies + v.miles * v.gas;
      var perHr = (v.price - costs) / (mins / 60);
      var needed = upr(v.target * mins / 60 + costs);
      var newPrice = Math.max(v.price, rnd(v.price * (1 + v.raise / 100)));
      var newPerHr = (newPrice - costs) / (mins / 60);
      var verdict = perHr >= v.target ? "Meets your target"
        : "Below your target by " + m2(v.target - perHr) + " an hour: " + m2(needed) + " reaches it";
      var after = newPerHr >= v.target ? "Meets your target at the new price"
        : "Still below by " + m2(v.target - newPerHr) + " an hour at the new price";
      var flags = [{ level: perHr >= v.target ? "good" : "warn", text: verdict + "." }];
      if (newPrice > v.price) flags.push({ level: newPerHr >= v.target ? "good" : "warn", text: "After the raise: " + after.charAt(0).toLowerCase() + after.slice(1) + "." });
      if (perHr < 0) flags.push({ level: "warn", text: "Gas and supplies cost more than the price: every visit loses money." });
      return {
        out: { mins: mins, costs: costs, per_hr: perHr, needed: needed, new_price: newPrice, new_per_hr: newPerHr,
               verdict: verdict, after: after },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
