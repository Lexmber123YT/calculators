/* Tutoring rate: what one month really pays per hour, and the rate a goal needs. Same math as the Tutor Income,
   Mileage & Tax Set-Aside Kit (Real Hourly Pay + Tax Pot Planner), for one month:
   kept = billed - platform fees; profit = kept - costs - miles x rate; all hours = lesson + prep + driving/admin;
   real pay per hour worked = profit / all hours; kept per lesson hour = kept / lesson hours;
   kept per lesson hour to reach a goal = (goal x all hours + costs + mileage) / lesson hours;
   tax pot = ROUND(MAX(0, profit) x pot %, 2). The rate to charge adds back the platform fees per lesson hour. */
(function (root) {
  "use strict";
  function r2(x) { return Math.round((x + 1e-9) * 100) / 100; }
  function m2(x) { return "$" + x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  (root.CDT_CALCS = root.CDT_CALCS || {})["tutoring-rate-calculator"] = {
    fields: [
      { name: "rate", label: "Your rate per lesson hour", min: 0, max: 2000 },
      { name: "lessons", label: "Lesson hours a month", min: 0, max: 400 },
      { name: "fees", label: "Platform fees a month", min: 0, allowZero: true, max: 100000 },
      { name: "costs", label: "Tutoring costs a month", min: 0, allowZero: true, max: 100000 },
      { name: "miles", label: "Business miles a month", min: 0, allowZero: true, max: 20000 },
      { name: "mrate", label: "Rate per mile", min: 0, max: 5 },
      { name: "prep", label: "Prep hours a month", min: 0, allowZero: true, max: 400 },
      { name: "drive", label: "Driving and admin hours a month", min: 0, allowZero: true, max: 400 },
      { name: "goal", label: "Take-home goal per hour worked", min: 0, max: 1000 },
      { name: "pct", label: "Tax pot", min: 0, allowZero: true, max: 100 }
    ],
    compute: function (v) {
      var billed = v.rate * v.lessons;
      if (v.fees > billed) return { error: "Platform fees are bigger than what you billed. Check those boxes." };
      var net = billed - v.fees;
      var ded = v.miles * v.mrate;
      var profit = net - v.costs - ded;
      var hours = v.lessons + v.prep + v.drive;
      var kept = net / v.lessons;
      var real = profit / hours;
      var need = (v.goal * hours + v.costs + ded) / v.lessons;
      var charge = need + v.fees / v.lessons;
      var pot = r2(Math.max(0, profit) * v.pct / 100);
      var after = (profit - pot) / hours;
      var unpaid = v.prep + v.drive;
      var flags = [];
      if (v.mrate > 1.5) flags.push({ level: "warn", text: "The mileage rate is dollars per mile. 72.5 cents is 0.725, not 72.5." });
      if (kept >= need - 0.005) flags.push({ level: "good", text: "You already keep about " + m2(kept) + " per lesson hour, at or above the " + m2(need) + " your goal needs." });
      else flags.push({ level: "warn", text: "You keep about " + m2(kept) + " per lesson hour; your goal needs about " + m2(need) + ", a gap of " + m2(need - kept) + " for every lesson hour." });
      if (unpaid > 0) flags.push({ level: "warn", text: "For every lesson hour you also work about " + Math.round(unpaid / v.lessons * 60) + " unpaid minutes of prep, driving and admin." });
      return {
        out: { billed: billed, net: net, ded: ded, profit: profit, hours: hours, kept_lesson: kept, real: real, need: need,
               charge: charge, gap: need - kept, pot: pot, after: after },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
