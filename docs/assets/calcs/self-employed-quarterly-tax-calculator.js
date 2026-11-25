/* Self-employed quarterly set-aside. Same math as the Contractor Tax Set-Aside, Mileage & Tool Write-Off Kit
   (Profit by Month + Set-Aside Planner), for one typical month repeated through 2026:
   profit = payments - card fees - job costs - tools & gear - overhead - miles x the rate in force that month;
   tax pot = ROUND(MAX(0, profit) x pot %, 2) per month; payments follow the IRS periods Jan-Mar, Apr-May, Jun-Aug,
   Sep-Dec. A set-aside estimate, not the IRS figure. */
(function (root) {
  "use strict";
  function r2(x) { return Math.round((x + 1e-9) * 100) / 100; }
  var PERIODS = [[1, 3], [4, 5], [6, 8], [9, 12]];

  (root.CDT_CALCS = root.CDT_CALCS || {})["self-employed-quarterly-tax-calculator"] = {
    fields: [
      { name: "pay", label: "Customer payments a month", min: 0, max: 10000000 },
      { name: "fees", label: "Card fees a month", min: 0, allowZero: true, max: 1000000 },
      { name: "jobs", label: "Job costs a month", min: 0, allowZero: true, max: 10000000 },
      { name: "tools", label: "Tools and gear a month", min: 0, allowZero: true, max: 1000000 },
      { name: "overhead", label: "Overhead a month", min: 0, allowZero: true, max: 1000000 },
      { name: "miles", label: "Business miles a month", min: 0, allowZero: true, max: 50000 },
      { name: "rate1", label: "Mileage rate, Jan to Jun", min: 0, max: 5 },
      { name: "rate2", label: "Mileage rate, Jul to Dec", min: 0, max: 5 },
      { name: "pct", label: "Tax pot", min: 0, allowZero: true, max: 100 }
    ],
    compute: function (v) {
      if (v.fees > v.pay) return { error: "Card fees are bigger than the payments. Check those two boxes." };
      var p = v.pct / 100, months = [], profit = 0, pot = 0, m;
      for (m = 1; m <= 12; m++) {
        var truck = v.miles * (m <= 6 ? v.rate1 : v.rate2);
        var pr = v.pay - v.fees - v.jobs - v.tools - v.overhead - truck;
        var pt = r2(Math.max(0, pr) * p);
        months.push({ truck: truck, profit: pr, pot: pt });
        profit += pr;
        pot += pt;
      }
      var per = PERIODS.map(function (ab) {
        var s = 0;
        for (var i = ab[0]; i <= ab[1]; i++) s += months[i - 1].pot;
        return s;
      });
      var flags = [];
      if (v.rate1 > 1.5 || v.rate2 > 1.5) flags.push({ level: "warn", text: "The mileage rate is dollars per mile. 72.5 cents is 0.725, not 72.5." });
      if (months[0].profit < 0 && months[6].profit < 0) flags.push({ level: "warn", text: "Costs are higher than payments every month, so there is no profit to set aside for." });
      else if (months[0].profit < 0 || months[6].profit < 0) flags.push({ level: "warn", text: "Some months show a loss. A loss month sets aside $0 and does not lower the others." });
      if (v.pct > 0 && v.pct < 20) flags.push({ level: "warn", text: "Self-employment tax alone is roughly 14% of profit. Under 20% may come up short; ask your preparer." });
      return {
        out: { profit: profit, pot: pot, left: profit - pot, p1: per[0], p2: per[1], p3: per[2], p4: per[3],
               pot_jan: months[0].pot, pot_jul: months[6].pot, truck_jan: months[0].truck, truck_jul: months[6].truck,
               profit_jan: months[0].profit },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
