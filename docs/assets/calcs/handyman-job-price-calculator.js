/* Handyman small-job price. Same math as the Handyman Small-Job Pricing & Profit Kit (Your Rate + Price a Job).
   Held at the kit's defaults: 48 weeks a year, 25% tax set-aside, 20 min setup and cleanup, 30 min per supply run,
   $35 per supply run, no dump fees. The hourly rate is the rate you need, rounded up to $5. */
(function (root) {
  "use strict";
  function round6(x) { return Math.round(x * 1e6) / 1e6; }
  function ceil5(x) { return Math.ceil(round6(x) / 5 - 1e-9) * 5; }
  function d0(x) { return "$" + Math.round(x).toLocaleString("en-US"); }
  var WEEKS = 48, TAX = 0.25, SETUP_MIN = 20, RUN_MIN = 30, RUN_CHARGE = 35;

  (root.CDT_CALCS = root.CDT_CALCS || {})["handyman-job-price-calculator"] = {
    fields: [
      { name: "takehome", label: "Take-home pay you want", min: 0, max: 1000000 },
      { name: "hours", label: "Job hours a week", min: 0, max: 80 },
      { name: "costs", label: "Yearly business costs", min: 0, max: 500000 },
      { name: "task_hours", label: "Hours the job takes on site", min: 0, max: 200 },
      { name: "materials", label: "Materials at your cost", min: 0, allowZero: true, max: 100000 },
      { name: "markup", label: "Markup on materials", min: 0, allowZero: true, max: 300 },
      { name: "drive", label: "Round-trip drive minutes", min: 0, allowZero: true, max: 600 },
      { name: "trip", label: "Trip charge", min: 0, allowZero: true, max: 5000 },
      { name: "runs", label: "Supply runs", min: 0, allowZero: true, max: 20, integer: true },
      { name: "minimum", label: "Your job minimum", min: 0, max: 5000 }
    ],
    compute: function (v) {
      var yh = WEEKS * v.hours;
      var need = (v.takehome / (1 - TAX) + v.costs) / yh;
      var breakeven = v.costs / yh;
      var rate = ceil5(need);
      var taskh = v.task_hours;
      var onsite = taskh + SETUP_MIN / 60;
      var mk = Math.min(3, Math.max(0, v.markup / 100));
      var labor = onsite * rate;
      var trip = v.trip;
      var mat = v.materials;
      var markupAmt = mat * mk;
      var runsChg = v.runs * RUN_CHARGE;
      var subtotal = labor + trip + mat + markupAmt + runsChg;
      var suggested = ceil5(Math.max(subtotal, v.minimum));
      var checked = suggested;
      var hours = onsite + v.drive / 60 + v.runs * RUN_MIN / 60;
      var hard = mat;
      var perHr = (checked - hard) / hours;
      var profit = checked - hard - hours * need;
      var hoursOnly = taskh * rate / hours;
      var verdict;
      if (checked < hard) verdict = "Losing money: the price doesn't cover materials and fees";
      else if (perHr < breakeven) verdict = "Below break-even: this visit costs you money";
      else if (checked < v.minimum) verdict = "Under your job minimum: quote at least " + d0(v.minimum);
      else if (perHr < need) verdict = "Covers your costs, but pays less than your goal per hour";
      else verdict = "Good: pays your goal on every hour, drive and supply runs included";
      var minCheck = subtotal < v.minimum ? "Minimum applies: " + d0(v.minimum) : "Clears your minimum";
      var flags = [];
      if (subtotal < v.minimum) flags.push({ level: "good", text: "Your job minimum sets this price. Without it, the job would come to " + d0(subtotal) + "." });
      flags.push({ level: perHr < need ? "warn" : "good", text: verdict + "." });
      return {
        out: { need: need, breakeven: breakeven, rate: rate, labor: labor, trip: trip, mat: mat, markup: markupAmt,
               runs_chg: runsChg, subtotal: subtotal, min_check: minCheck, suggested: suggested, hours: hours,
               per_hr: perHr, profit: profit, hours_only: hoursOnly, verdict: verdict },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
