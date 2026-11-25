/* Home daycare late pick-up fee. Same math as the Home Daycare Sign-In, Attendance & Late Pick-Up Fee Kit
   (Attendance Log "Late fee by the rules" and Start Here "Your late fee in words").
   Up to the grace minutes late: no fee. Past that, the minutes charged start at the end of the grace time
   (or at the pick-up time, if you choose), per minute or per block started, never more than your limit. */
(function (root) {
  "use strict";
  function r2(x) { return Math.sign(x) * Math.round(Math.abs(x) * 100 + 1e-9) / 100; }
  function r6(x) { return Math.round(x * 1e6) / 1e6; }
  var TABLE = [5, 10, 15, 30, 60];

  function feeFor(m, v) {
    if (v.fee <= 0 || m <= v.grace) return 0;
    var counted = m - (v.from === "Closing time" ? 0 : v.grace);
    var f = v.type === "Per block" ? Math.ceil(r6(counted / v.block) - 1e-9) * v.fee : counted * v.fee;
    return r2(v.cap > 0 ? Math.min(v.cap, f) : f);
  }
  function rule(v) {
    var s = v.type === "Per block"
      ? "$" + v.fee.toFixed(2) + " for each " + v.block + " minutes or part of " + v.block + " minutes"
      : "$" + v.fee.toFixed(2) + " for each minute";
    if (v.grace <= 0) s += " after the pick-up time";
    else if (v.from === "Closing time") s += " after the pick-up time, once the " + v.grace + "-minute grace time has passed";
    else s += " after the " + v.grace + "-minute grace time ends";
    if (v.cap > 0) s += ", up to $" + v.cap.toFixed(2) + " for one late pick-up";
    return s;
  }

  (root.CDT_CALCS = root.CDT_CALCS || {})["daycare-late-pickup-fee-calculator"] = {
    fields: [
      { name: "minutes", label: "Minutes late", min: 0, allowZero: true, max: 360, integer: true },
      { name: "grace", label: "Grace minutes", min: 0, allowZero: true, max: 120, integer: true },
      { name: "from", label: "The fee counts from", choices: ["End of grace time", "Closing time"] },
      { name: "type", label: "Fee is charged", choices: ["Per minute", "Per block"] },
      { name: "fee", label: "Fee amount", min: 0.01, max: 500 },
      { name: "block", label: "Block length", min: 5, max: 240, integer: true },
      { name: "cap", label: "Most one late pick-up can cost", min: 0, allowZero: true, max: 5000 }
    ],
    compute: function (v) {
      var out = { fee: feeFor(v.minutes, v), rule: rule(v) };
      TABLE.forEach(function (m) { out["fee" + m] = feeFor(m, v); });
      var flags = [];
      if (v.minutes <= v.grace) flags.push({ level: "good", text: "Within your grace time: no fee for this pick-up." });
      else if (v.cap > 0 && out.fee >= v.cap) flags.push({ level: "warn", text: "Your limit sets this fee. Without it, the rule would charge more." });
      if (v.from === "Closing time" && v.grace > 0)
        flags.push({ level: "warn", text: "Counting from the pick-up time means a parent " + (v.grace + 1) + " minutes late pays for every minute, the grace minutes too. Say so in your policy." });
      return { out: out, flags: flags };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
