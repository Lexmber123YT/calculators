/* Dog grooming price. Same math as the Dog Grooming Pricing & Profit Kit (Your Numbers + Breed Groups + Price a Groom).
   Held at the kit's defaults: 10% payroll extras, 0% commission, 3% card fee, 10 extra minutes per groom (check-in,
   kennel, cleanup), no vehicle cost, the kit's size, coat, condition, service and breed-group times, and no add-ons
   other than nail grinds and de-matting blocks. The suggested price keeps your margin and rounds up to $5. */
(function (root) {
  "use strict";
  function round6(x) { return Math.round(x * 1e6) / 1e6; }
  function ceil5(x) { return Math.ceil(round6(x) / 5 - 1e-9) * 5; }
  var EXTRAS = 0.10, COMM = 0, FEE = 0.03, EXTRA_MIN = 10, VEHICLE = 0;
  var SIZES = { "Small": [30, 40, 3.00], "Medium": [40, 50, 4.50], "Large": [55, 60, 6.50], "X-Large": [70, 75, 9.00] };
  var COATS = { "Smooth / short": 0.8, "Wire": 1.0, "Silky / drop": 1.0, "Double coat": 1.4, "Curly / doodle": 1.3 };
  var CONDS = { "Well kept (under 6 weeks)": 1.0, "Overdue (7-12 weeks)": 1.15, "Tangled or neglected": 1.35 };
  var SERVS = { "Bath & brush": 0, "Bath & tidy": 0.35, "Full groom": 1.0, "Hand-scissor finish": 1.4, "Shave-down": 0.6 };
  var GROUPS = { "Smooth & short coats": 0.4, "Double coats": 0.8, "Silky drop coats": 1.0, "Terriers": 1.1,
                 "Spaniels & setters": 1.15, "Poodles & bichons": 1.3, "Doodles & oodle mixes": 1.35,
                 "Giant & working breeds": 1.0, "Mixed / other": 1.0 };
  var NAIL = [10, 0.25], DEMAT = [15, 0.50];

  (root.CDT_CALCS = root.CDT_CALCS || {})["dog-grooming-price-calculator"] = {
    fields: [
      { name: "group", label: "Breed group", choices: Object.keys(GROUPS) },
      { name: "size", label: "Size", choices: Object.keys(SIZES) },
      { name: "coat", label: "Coat type", choices: Object.keys(COATS) },
      { name: "condition", label: "Coat condition", choices: Object.keys(CONDS) },
      { name: "service", label: "Service", choices: Object.keys(SERVS) },
      { name: "nails", label: "Nail grinds", min: 0, allowZero: true, max: 5, integer: true },
      { name: "demat", label: "De-matting blocks", min: 0, allowZero: true, max: 16, integer: true },
      { name: "pay", label: "Groomer pay per hour", min: 0, max: 500 },
      { name: "overhead", label: "Monthly overhead", min: 0, allowZero: true, max: 100000 },
      { name: "hours", label: "Grooming hours a month", min: 1, max: 2000 },
      { name: "margin", label: "Profit margin you want", min: 0, allowZero: true, max: 80 },
      { name: "price_now", label: "Price you charge now", min: 0, allowZero: true, optional: true, max: 5000 }
    ],
    compute: function (v) {
      var sz = SIZES[v.size], cond = CONDS[v.condition];
      var bath = sz[0] * COATS[v.coat] * cond;
      var cut = sz[1] * GROUPS[v.group] * SERVS[v.service] * cond;
      var addMin = v.nails * NAIL[0] + v.demat * DEMAT[0];
      var minutes = Math.round(round6(bath + cut + addMin)) + EXTRA_MIN;
      var hrs = minutes / 60;
      var laborHr = v.pay * (1 + EXTRAS);
      var overheadHr = v.overhead / v.hours;
      var pay = hrs * laborHr;
      var supplies = sz[2] + v.nails * NAIL[1] + v.demat * DEMAT[1];
      var ovh = hrs * overheadHr;
      var cost = pay + supplies + ovh + VEHICLE;
      var margin = v.margin / 100;
      var denom = Math.max(0.05, 1 - margin - FEE - COMM);
      var suggested = ceil5(cost / denom);
      var checked = v.price_now > 0 ? v.price_now : suggested;
      var fee = checked * FEE, comm = checked * COMM;
      var trueCost = cost + fee + comm;
      var profit = checked - trueCost;
      var pmargin = checked > 0 ? profit / checked : 0;
      var perHr = hrs > 0 ? profit / hrs : 0;
      var verdict = checked < trueCost ? "Below your cost: you lose money on this dog"
        : pmargin < margin ? "Profitable, but under your target margin" : "Good: meets your target margin";
      var flags = [];
      if (v.price_now > 0) {
        var gap = suggested - v.price_now;
        if (gap > 0) flags.push({ level: "warn", text: "Your price is $" + gap.toFixed(0) + " under the suggested price for this dog." });
      }
      flags.push({ level: verdict.indexOf("Good") === 0 ? "good" : "warn", text: verdict + "." });
      return {
        out: { bath: bath, cut: cut, minutes: minutes, pay_cost: pay, supplies: supplies, overhead_cost: ovh, cost: cost,
               suggested: suggested, checked: checked, fee: fee, true_cost: trueCost, profit: profit, pmargin: pmargin,
               per_hr: perHr, verdict: verdict },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
