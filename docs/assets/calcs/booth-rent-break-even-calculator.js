(function (root) {
  "use strict";
  var WPM = 4.33; // weeks per month, same as the kit
  function ceil(x) { return Math.ceil(x - 1e-9); }
  function r1(x) { return Math.round(x * 10) / 10; }
  (root.CDT_CALCS = root.CDT_CALCS || {})["booth-rent-break-even-calculator"] = {
    fields: [
      { name: "rent", label: "Rent per week", max: 100000 },
      { name: "other", label: "Other fixed costs per month", allowZero: true, max: 1000000 },
      { name: "hours", label: "Chair hours per week", max: 120 },
      { name: "ticket", label: "Average service price", max: 100000 },
      { name: "product", label: "Product cost per service", allowZero: true, max: 100000 },
      { name: "minutes", label: "Minutes in the chair per service", max: 1440 },
      { name: "fee", label: "Card fee percent", allowZero: true, max: 60 },
      { name: "tax", label: "Tax set-aside percent", allowZero: true, max: 60 },
      { name: "goal", label: "Monthly take-home goal", allowZero: true, max: 1000000 }
    ],
    compute: function (v) {
      var fee = v.fee / 100, tax = v.tax / 100;
      var fixed = v.rent + v.other / WPM;
      var fees = v.ticket * fee;
      var left = v.ticket - v.product - fees;
      if (left <= 0) return { error: "Product cost and card fees are as big as your price, so no service leaves anything toward the rent. Check the price and product cost." };
      var beWeek = ceil(fixed / left);
      var beMonth = ceil(fixed * WPM / left);
      var goalWeek = ceil((fixed + v.goal / (1 - tax) / WPM) / left);
      var goalHours = goalWeek * v.minutes / 60;
      var fixedHr = fixed / v.hours;
      var hourly = left / (v.minutes / 60) - fixedHr;
      var quick = ceil(v.rent / v.ticket);
      var flags = [];
      if (goalHours <= v.hours) flags.push({ level: "good", text: "Your goal fits: about " + r1(v.hours - goalHours) + " chair hours a week to spare." });
      else flags.push({ level: "warn", text: "Your goal needs about " + r1(goalHours - v.hours) + " more chair hours a week than you hold. Raise the average price or add hours." });
      if (beWeek * v.minutes / 60 > v.hours) flags.push({ level: "warn", text: "Even break-even needs more chair hours than you hold." });
      if (hourly <= 0) flags.push({ level: "warn", text: "At this price, an hour in your chair pays less than the rent and costs behind it." });
      flags.push({ level: "", text: "The quick rule (rent / price) says " + quick + " services a week. It leaves out your other costs, product and card fees." });
      return { out: { fixed: fixed, fees: fees, left: left, be_week: beWeek, be_month: beMonth, goal_week: goalWeek, goal_hours: goalHours, fixed_hr: fixedHr, hourly: hourly, quick: quick }, flags: flags };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
