(function (root) {
  "use strict";
  // Same math as the Tutor Lesson Package & Pricing Kit (Rate & Package Builder).
  // Held at the kit's defaults: monthly business costs $90 spread over 26 lessons a month, packages rounded to the nearest $5.
  var MONTHLY = 90, PER_MONTH = 26, ROUND_TO = 5;
  (root.CDT_CALCS = root.CDT_CALCS || {})["tutoring-package-price-calculator"] = {
    fields: [
      { name: "price", label: "Single-lesson price", max: 1000 },
      { name: "length", label: "Lesson length (minutes)", max: 240, integer: true },
      { name: "prep", label: "Prep minutes", max: 240, allowZero: true, integer: true },
      { name: "travel", label: "Travel minutes", max: 240, allowZero: true, integer: true },
      { name: "admin", label: "Messages and notes minutes", max: 240, allowZero: true, integer: true },
      { name: "tcost", label: "Travel cost per lesson", max: 500, allowZero: true },
      { name: "fee", label: "Card or platform fees (%)", max: 60, allowZero: true },
      { name: "tax", label: "Tax set-aside (%)", max: 60, allowZero: true },
      { name: "goal", label: "Take-home goal per hour", max: 1000 },
      { name: "packn", label: "Lessons in the package", min: 2, max: 200, integer: true },
      { name: "disc", label: "Package discount (%)", max: 90, allowZero: true }
    ],
    compute: function (v) {
      var fee = v.fee / 100, tax = v.tax / 100, disc = v.disc / 100;
      var share = MONTHLY / PER_MONTH;
      var hours = (v.length + v.prep + v.travel + v.admin) / 60;
      var costs = v.price * fee + v.tcost + share;
      var taxamt = Math.max(0, v.price - costs) * tax;
      var take = v.price - costs - taxamt;
      var realhr = take / hours;
      var needed = (v.goal * hours / (1 - tax) + v.tcost + share) / (1 - fee);
      var suggested = Math.ceil(Math.round(needed * 1e6) / 1e6 / 5) * 5;
      var check = take < 0 ? "Loses money" : (realhr < v.goal ? "Under goal" : "Good");
      var packprice = Math.round(v.price * v.packn * (1 - disc) / ROUND_TO + 1e-9) * ROUND_TO;
      var packper = packprice / v.packn;
      var prof = packper * (1 - fee) - (v.tcost + share);
      var packpay = (prof > 0 ? prof * (1 - tax) : prof) / hours;
      var packcheck = prof < 0 ? "Loses money" : (packpay < v.goal ? "Under goal" : "OK");
      var flags = [];
      if (check === "Loses money") flags.push({ level: "warn", text: "A single lesson at this price loses money once costs are counted." });
      else if (check === "Under goal") flags.push({ level: "warn", text: "At this price a single lesson pays less per hour of work than your goal. A price of about $" + suggested + " would reach it." });
      else flags.push({ level: "good", text: "A single lesson pays at or above your goal for every hour of work." });
      if (packcheck === "Loses money") flags.push({ level: "warn", text: "The package price is below your costs per lesson. Make the discount smaller." });
      else if (packcheck === "Under goal") flags.push({ level: "warn", text: "The discount pushes the package below your goal per hour. A smaller discount or a higher single price fixes that." });
      else flags.push({ level: "good", text: "The package still pays at or above your goal per hour of work." });
      return { out: {
        hours: hours, charge: v.price / (v.length / 60), costs: costs, taxamt: taxamt, takehome: take, realhr: realhr,
        needed: needed, suggested: suggested, check: check,
        packprice: packprice, packper: packper, packpay: packpay, packcheck: packcheck, packsave: v.price * v.packn - packprice
      }, flags: flags };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
