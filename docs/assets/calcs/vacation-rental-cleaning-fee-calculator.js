/* Vacation rental cleaning fee. Same math as the Short-Term Rental Turnover, Cleaning & Restock Kit
   (the per-turn columns on Check-Ins & Outs and the suggested fee on Cleaning Fee Check).
   Fee you keep = fee x (1 - the platform's cut). Turn cost = cleaner pay + laundry + supplies. Gap = keep - cost.
   Suggested fee = ((cleaner pay + laundry) x 1.1 + supplies) / (1 - cut), rounded up to the next $5.
   Held out: the same-day extra pay (the kit adds it on a same-day turn). */
(function (root) {
  "use strict";
  function r2(x) { return Math.sign(x) * Math.round(Math.abs(x) * 100 + 1e-9) / 100; }
  function r6(x) { return Math.round(x * 1e6) / 1e6; }
  function m2(x) { return "$" + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  (root.CDT_CALCS = root.CDT_CALCS || {})["vacation-rental-cleaning-fee-calculator"] = {
    fields: [
      { name: "fee", label: "Cleaning fee you charge", min: 0, allowZero: true, max: 10000 },
      { name: "cut", label: "The booking platform's cut", min: 0, allowZero: true, max: 50 },
      { name: "pay", label: "Cleaner pay per turn", min: 0, max: 10000 },
      { name: "laundry", label: "Laundry per turn", min: 0, allowZero: true, max: 1000 },
      { name: "supplies", label: "Supplies per turn", min: 0, allowZero: true, max: 1000 }
    ],
    compute: function (v) {
      var cut = v.cut / 100;
      var kept = r2(v.fee * (1 - cut));
      var ls = r2(v.laundry + v.supplies);
      var cost = r2(v.pay + ls);
      var gap = r2(kept - cost);
      var base = r2(((v.pay + v.laundry) * 1.1 + v.supplies) / (1 - cut));
      var suggested = Math.ceil(r6(base / 5) - 1e-9) * 5;
      var flags = [];
      if (gap < 0) flags.push({ level: "warn", text: "Each turn costs you " + m2(gap) + " more than the fee you keep." });
      else flags.push({ level: "good", text: "Your fee covers the turn, with " + m2(gap) + " left over." });
      if (suggested > v.fee) flags.push({ level: "warn", text: "The suggested fee is higher than what you charge now." });
      return {
        out: { kept: kept, cut_amt: r2(v.fee - kept), pay: v.pay, laundry_sup: ls, cost: cost, gap: gap, suggested: suggested },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
