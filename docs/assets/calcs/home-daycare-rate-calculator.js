(function (root) {
  "use strict";
  // Same math as the kit's "Rate Calculator" sheet. Held at kit defaults: care weights Infant 1.25, Toddler 1.10,
  // Preschool 1.00, School-age 0.60. Suggested rate = needed rate rounded up to the next $5.
  var W = { infant: 1.25, toddler: 1.10, pre: 1.00, school: 0.60 };

  (root.CDT_CALCS = root.CDT_CALCS || {})["home-daycare-rate-calculator"] = {
    fields: [
      { name: "takehome", label: "Take-home pay you want per year", max: 1000000 },
      { name: "helper", label: "Helper pay per month", allowZero: true, max: 50000 },
      { name: "food", label: "Food per month", allowZero: true, max: 20000 },
      { name: "other", label: "All other monthly costs", allowZero: true, max: 50000 },
      { name: "weeks", label: "Weeks you bill per year", min: 1, max: 52 },
      { name: "fill", label: "Average fullness (%)", min: 1, max: 100 },
      { name: "infant", label: "Infant slots", allowZero: true, integer: true, max: 30 },
      { name: "toddler", label: "Toddler slots", allowZero: true, integer: true, max: 30 },
      { name: "pre", label: "Preschool slots", allowZero: true, integer: true, max: 30 },
      { name: "school", label: "School-age slots", allowZero: true, integer: true, max: 30 }
    ],
    compute: function (v) {
      var units = v.infant * W.infant + v.toddler * W.toddler + v.pre * W.pre + v.school * W.school;
      if (!(units > 0)) return { error: "Enter at least one child slot, so the costs have somewhere to be shared." };
      var monthly = v.helper + v.food + v.other;
      var year = v.takehome + monthly * 12;
      var week = year / v.weeks;
      var perUnit = week / (units * (v.fill / 100));
      var up5 = function (x) { return Math.ceil(x / 5 - 1e-9) * 5; };
      var slots = v.infant + v.toddler + v.pre + v.school;
      var out = {
        monthly: monthly, year: year, week: week, month: year / 12,
        infant: up5(perUnit * W.infant), toddler: up5(perUnit * W.toddler),
        pre: up5(perUnit * W.pre), school: up5(perUnit * W.school),
        infant_need: perUnit * W.infant, toddler_need: perUnit * W.toddler, pre_need: perUnit * W.pre, school_need: perUnit * W.school
      };
      var flags = [];
      if (v.fill < 80) flags.push({ level: "warn", text: "Planning for less than 80% full pushes every rate up. Check that your area will pay it." });
      flags.push({ level: "good", text: "Compare these with your state's child care market rate survey before you settle on a number." });
      if (v.weeks < 48) flags.push({ level: "warn", text: "Billing under 48 weeks means unpaid weeks off. Many providers bill 52 so holidays and vacation are covered." });
      return { out: out, flags: flags };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
