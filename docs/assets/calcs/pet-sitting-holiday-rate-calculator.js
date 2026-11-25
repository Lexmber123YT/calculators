/* Pet sitting holiday rate for one stay. Same math as the Pet Sitter Holiday Rates, Booking & Deposit Kit
   (Prices & Limits + Peak Dates + Holiday Bookings): the surcharge lands only on the days of the stay that fall on a
   peak date, each day at its own %. The page groups the peak days into two levels (a top holiday % and a smaller
   one) instead of typing dates. Price per night or visit = normal price + each extra pet; visit services multiply
   by visits a day. Money rounds to the cent as the kit does. */
(function (root) {
  "use strict";
  function r2(x) { return Math.round(Math.round(x * 1e6) / 1e4) / 100; }

  (root.CDT_CALCS = root.CDT_CALCS || {})["pet-sitting-holiday-rate-calculator"] = {
    fields: [
      { name: "per", label: "Charged per", choices: ["Night", "Visit"] },
      { name: "price", label: "Normal price per night or visit", min: 0, max: 1000 },
      { name: "extra_pets", label: "Extra pets", min: 0, allowZero: true, max: 20, integer: true },
      { name: "extra_price", label: "Price for each extra pet", min: 0, allowZero: true, max: 200 },
      { name: "visits", label: "Visits a day", min: 1, max: 12, integer: true },
      { name: "nights", label: "Nights or days in the stay", min: 1, max: 60, integer: true },
      { name: "top_days", label: "Top holiday days in the stay", min: 0, allowZero: true, max: 60, integer: true },
      { name: "top_pct", label: "Top holiday surcharge", min: 0, allowZero: true, max: 300 },
      { name: "other_days", label: "Other peak days in the stay", min: 0, allowZero: true, max: 60, integer: true },
      { name: "other_pct", label: "Other peak surcharge", min: 0, allowZero: true, max: 300 },
      { name: "deposit", label: "Deposit", min: 0, allowZero: true, max: 100 }
    ],
    compute: function (v) {
      if (v.top_days + v.other_days > v.nights)
        return { error: "The peak days add up to more than the nights or days in the stay. Lower one of them." };
      var unit = v.price + v.extra_pets * v.extra_price;
      var perDay = v.per === "Visit" ? Math.max(1, Math.floor(v.visits)) : 1;
      var peakDays = (v.top_pct > 0 ? v.top_days : 0) + (v.other_pct > 0 ? v.other_days : 0);
      var sumPct = v.top_days * v.top_pct / 100 + v.other_days * v.other_pct / 100;
      var normal = r2(unit * perDay * v.nights);
      var surcharge = r2(unit * perDay * sumPct);
      var total = normal + surcharge;
      var dep = v.deposit > 0 ? r2(total * Math.min(1, v.deposit / 100)) : 0;
      var balance = r2(total - dep);
      var avg = total / v.nights;
      var flags = [];
      if (surcharge > 0) flags.push({ level: "good", text: "The surcharge adds $" + surcharge.toFixed(2) + ", only on the " + peakDays + (peakDays === 1 ? " peak day" : " peak days") + " of this stay." });
      if (peakDays === 0) flags.push({ level: "warn", text: "No peak days typed: this is your normal price." });
      return {
        out: { unit: unit, per_day: perDay, peak_days: peakDays, normal: normal, surcharge: surcharge, total: total,
               deposit_due: dep, balance: balance, avg: avg },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
