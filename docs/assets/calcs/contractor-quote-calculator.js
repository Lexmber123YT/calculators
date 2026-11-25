/* Contractor quote price. Same math as the Contractor Quote & Get-Paid Kit (Your Rates + Quote Builder).
   Held at the kit's defaults: payroll taxes + workers' comp 18%, 40 paid hours a week, 48 weeks a year, 1 person in
   the field, 15% markup on subs, rentals and dump fees, no permit line, deposit 30% on jobs over $500, no deposit cap.
   The price is rounded up to $5 and never goes under your minimum. */
(function (root) {
  "use strict";
  function round6(x) { return Math.round(x * 1e6) / 1e6; }
  function ceil5(x) { return Math.ceil(round6(x) / 5 - 1e-9) * 5; }
  function round0(x) { return Math.round(Number(x.toPrecision(12))); }
  var BURDEN = 0.18, PAID = 40, WEEKS = 48, PEOPLE = 1, OTHER_MK = 0.15, DEP_PCT = 0.30, DEP_OVER = 500;

  (root.CDT_CALCS = root.CDT_CALCS || {})["contractor-quote-calculator"] = {
    fields: [
      { name: "wage", label: "Hourly pay", min: 0, max: 500 },
      { name: "bill", label: "Billable hours a week", min: 0, max: 80 },
      { name: "overhead", label: "Yearly overhead", min: 0, allowZero: true, max: 1000000 },
      { name: "labor", label: "Labor hours on the job", min: 0, max: 5000 },
      { name: "materials", label: "Materials at your cost", min: 0, allowZero: true, max: 1000000 },
      { name: "markup", label: "Markup on materials", min: 0, allowZero: true, max: 300 },
      { name: "other", label: "Subs, rentals and dump fees", min: 0, allowZero: true, max: 1000000 },
      { name: "trip", label: "Trip charge", min: 0, allowZero: true, max: 5000 },
      { name: "cont", label: "Contingency", min: 0, allowZero: true, max: 50 },
      { name: "margin", label: "Target profit margin", min: 0, allowZero: true, max: 90 },
      { name: "minimum", label: "Minimum job charge", min: 0, allowZero: true, max: 100000 }
    ],
    compute: function (v) {
      var m = v.margin / 100, c = v.cont / 100, mk = v.markup / 100;
      var laborHr = v.wage * (1 + BURDEN) * PAID / v.bill;
      var ovhHr = v.overhead / (v.bill * WEEKS * PEOPLE);
      var loaded = laborHr + ovhHr;
      var rateMin = loaded / (1 - m);
      var cost = v.labor * loaded + v.materials + v.other;
      var markups = v.materials * mk + v.other * OTHER_MK;
      var trip = v.trip;
      var cont = (cost + markups + trip) * c;
      var sum4 = cost + markups + trip + cont;
      var profitT = sum4 / (1 - m) - sum4;
      var suggested = ceil5(Math.max(v.minimum, sum4 + profitT));
      var profit = suggested - cost;
      var margin = profit / suggested;
      var marginUsed = (profit - cont) / suggested;
      var perLabor = profit / v.labor;
      var deposit = suggested > DEP_OVER ? round0(suggested * DEP_PCT) : 0;
      var verdict;
      if (suggested < cost) verdict = "Below your cost: you pay to do this job";
      else if (margin < m) verdict = "Profitable, but under your target margin";
      else verdict = "Good: covers every cost and your margin";
      var flags = [];
      if (v.minimum > sum4 + profitT) flags.push({ level: "good", text: "Your minimum job charge sets this price." });
      if (marginUsed < m) flags.push({ level: "warn", text: "If the whole contingency gets used, your margin drops to " + (marginUsed * 100).toFixed(1) + "%." });
      flags.push({ level: margin < m ? "warn" : "good", text: verdict + "." });
      return {
        out: { loaded: loaded, rate_min: rateMin, cost: cost, markups: markups, trip: trip, cont: cont, profit_t: profitT,
               suggested: suggested, profit: profit, margin: margin, margin_used: marginUsed, per_labor: perLabor,
               deposit: deposit, verdict: verdict },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
