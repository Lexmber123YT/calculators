(function (root) {
  "use strict";
  function r1(x) { return Math.round(x * 10) / 10; }
  (root.CDT_CALCS = root.CDT_CALCS || {})["short-term-rental-profit-calculator"] = {
    fields: [
      { name: "rate", label: "Average nightly rate", max: 100000 },
      { name: "nights", label: "Nights in the stay", integer: true, max: 60 },
      { name: "clean", label: "Cleaning fee you charge", allowZero: true, max: 10000 },
      { name: "fee", label: "Platform fee percent", allowZero: true, max: 50 },
      { name: "cleaner", label: "Cleaner pay per turnover", allowZero: true, max: 10000 },
      { name: "laundry", label: "Laundry per turnover", allowZero: true, max: 10000 },
      { name: "supplies", label: "Supplies per turnover", allowZero: true, max: 10000 },
      { name: "target", label: "Profit target per night", allowZero: true, max: 5000 },
      { name: "fixed", label: "Fixed costs per month", allowZero: true, max: 1000000 },
      { name: "occ", label: "Occupancy you expect", max: 100 }
    ],
    compute: function (v) {
      var fee = v.fee / 100;
      var rent = v.nights * v.rate;
      var feeAmt = (rent + v.clean) * fee;
      var turn = v.cleaner + v.laundry + v.supplies;
      var profit = rent + v.clean - feeAmt - turn;
      var ppn = profit / v.nights;
      var kept = v.rate * (1 - fee) + (v.clean * (1 - fee) - turn) / v.nights;
      if (kept <= 0) return { error: "At these numbers every booked night loses money, so there is no break-even. Check the rate, fee and turnover costs." };
      var yearly = v.fixed * 12;
      var be = yearly / (365 * kept);
      var nightsNeeded = yearly / kept;
      var cushion = (v.occ / 100 - be) * 100;
      var quick = yearly / (365 * v.rate);
      var flags = [];
      if (profit < 0) flags.push({ level: "warn", text: "This stay loses money before any fixed costs." });
      else if (v.target > 0 && ppn < v.target) flags.push({ level: "warn", text: "This stay is under your profit target per night. A short stay carries the same turnover as a long one." });
      else if (v.target > 0) flags.push({ level: "good", text: "This stay clears your profit target per night." });
      if (be > 1) flags.push({ level: "warn", text: "Break-even is over 100%. Even a fully booked year would not cover the fixed costs at these numbers." });
      else if (cushion < 0) flags.push({ level: "warn", text: "Your expected occupancy is " + r1(-cushion) + " points below break-even." });
      else flags.push({ level: cushion < 10 ? "warn" : "good", text: "Your expected occupancy is " + r1(cushion) + " points over break-even." + (cushion < 10 ? " That is a thin cushion." : "") });
      flags.push({ level: "", text: "The quick rule (fixed costs / 365 x rate) says " + Math.round(quick * 100) + "%. It leaves out the platform fee and the turnovers." });
      return { out: { rent: rent, clean: v.clean, fee: feeAmt, turn: turn, profit: profit, ppn: ppn, kept: kept, be: be, nights: nightsNeeded, cushion: cushion, quick: quick }, flags: flags };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
