/* Pest control visit price. Same math as the Pest Control Service Slip & Visit Profit Kit (Visit Profit Check, one service row).
   Cost of a visit = materials + (minutes on site + drive minutes) / 60 x tech cost per hour + drive minutes x truck cost per minute.
   Price to reach your target = cost / (1 - target %), rounded up to the dollar. Profit = price - cost. */
(function (root) {
  "use strict";
  function r2(x) { return Math.sign(x) * Math.round(Math.abs(x) * 100 + 1e-9) / 100; }
  function r6(x) { return Math.round(x * 1e6) / 1e6; }
  function verdict(price, profit, t) {
    if (price === 0) return "Free";
    if (r2(profit) < 0) return "Loses money";
    if (r2(profit) < r2(price * t)) return "Below target";
    return "OK";
  }
  function d0(x) { return "$" + Math.round(x).toLocaleString("en-US"); }

  (root.CDT_CALCS = root.CDT_CALCS || {})["pest-control-price-calculator"] = {
    fields: [
      { name: "wage", label: "Tech time cost per hour", min: 0, max: 500 },
      { name: "truck", label: "Truck cost per drive minute", min: 0, allowZero: true, max: 20 },
      { name: "target", label: "Profit you want from a visit", min: 0, allowZero: true, max: 90 },
      { name: "materials", label: "Materials per visit", min: 0, allowZero: true, max: 100000 },
      { name: "onsite", label: "Minutes on site", min: 0, max: 1440 },
      { name: "drive", label: "Drive minutes", min: 0, allowZero: true, max: 1440 },
      { name: "first", label: "First-visit price", min: 0, max: 100000 },
      { name: "recurring", label: "Recurring price", min: 0, max: 100000 }
    ],
    compute: function (v) {
      var t = v.target / 100;
      var hrs = (v.onsite + v.drive) / 60;
      var cost = v.materials + hrs * v.wage + v.drive * v.truck;
      var pf = v.first - cost, pr = v.recurring - cost;
      var need = Math.ceil(r6(cost / (1 - t)) - 1e-9);
      var vf = verdict(v.first, pf, t), vr = verdict(v.recurring, pr, t);
      var flags = [];
      [["first-visit", vf], ["recurring", vr]].forEach(function (p) {
        if (p[1] === "Loses money") flags.push({ level: "warn", text: "Your " + p[0] + " price loses money: it is under the " + d0(cost) + " a visit costs you." });
        else if (p[1] === "Below target") flags.push({ level: "warn", text: "Your " + p[0] + " price is below your target. To keep " + v.target + "% of the price as profit, charge at least " + d0(need) + "." });
        else flags.push({ level: "good", text: "Your " + p[0] + " price meets your target." });
      });
      return {
        out: { cost: cost, need: need, hours: hrs, profit_first: pf, profit_rec: pr, pph_first: pf / hrs, pph_rec: pr / hrs,
               verdict_first: vf, verdict_rec: vr },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
