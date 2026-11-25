/* Mileage deduction for 2026, with the mid-year rate change. Same math as the Cleaning Business Mileage, Supplies &
   Tax Set-Aside Kit (Mileage Log + Tax Set-Aside): each trip uses the rate in force on its date; deduction = miles x
   rate; profit = income - costs - mileage deduction; set-aside = ROUND(MAX(0, profit) x set-aside %, 2).
   The kit works month by month; this page treats each half of the year as one block. */
(function (root) {
  "use strict";
  function r2(x) { return Math.round((x + 1e-9) * 100) / 100; }
  function d0(x) { return "$" + Math.round(x).toLocaleString("en-US"); }

  (root.CDT_CALCS = root.CDT_CALCS || {})["mileage-deduction-calculator"] = {
    fields: [
      { name: "miles1", label: "Business miles, Jan 1 to Jun 30", min: 0, allowZero: true, max: 500000 },
      { name: "rate1", label: "Rate per mile, first half", min: 0, max: 5 },
      { name: "miles2", label: "Business miles, Jul 1 to Dec 31", min: 0, allowZero: true, max: 500000 },
      { name: "rate2", label: "Rate per mile, second half", min: 0, max: 5 },
      { name: "profit1", label: "Profit before miles, first half", min: 0, allowZero: true, max: 100000000 },
      { name: "profit2", label: "Profit before miles, second half", min: 0, allowZero: true, max: 100000000 },
      { name: "pct", label: "Tax set-aside", min: 0, allowZero: true, max: 100 }
    ],
    compute: function (v) {
      if (v.miles1 + v.miles2 <= 0) return { error: "Type your business miles for at least one half of the year." };
      var p = v.pct / 100;
      var ded1 = v.miles1 * v.rate1, ded2 = v.miles2 * v.rate2;
      var ded = ded1 + ded2, miles = v.miles1 + v.miles2;
      var a1 = v.profit1 - ded1, a2 = v.profit2 - ded2;
      var set1 = r2(Math.max(0, a1) * p), set2 = r2(Math.max(0, a2) * p);
      var before = r2(Math.max(0, v.profit1) * p) + r2(Math.max(0, v.profit2) * p);
      var setaside = set1 + set2;
      var flags = [];
      if (v.rate1 > 1.5 || v.rate2 > 1.5) flags.push({ level: "warn", text: "The rate is dollars per mile. 72.5 cents is 0.725, not 72.5." });
      if (a1 < 0 || a2 < 0) flags.push({ level: "warn", text: "Miles are bigger than your profit for part of the year. A loss sets aside $0; it does not lower the other half." });
      if (p > 0 && before > setaside) flags.push({ level: "good", text: "Logging these miles lowers the suggested set-aside by about " + d0(before - setaside) + " at your " + v.pct + "%." });
      return {
        out: { ded1: ded1, ded2: ded2, ded: ded, miles: miles, after: a1 + a2, setaside: setaside, set1: set1, set2: set2,
               saved: before - setaside, per_mile: ded / miles },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
