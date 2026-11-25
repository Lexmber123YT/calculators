/* Construction draw schedule. Same math as the Contractor Draw & Final Payment Tracker (Draw Rules + Job List).
   Each draw = contract price x its percent, rounded to the cent. When the percents total 100%, the last draw takes
   whatever is left so the draws add up to the exact price. An optional deposit cap cuts draw 1 to the cap and moves the
   rest to draw 2. Percents past the number of draws are ignored. */
(function (root) {
  "use strict";
  function r2(x) { var s = x < 0 ? -1 : 1; return s * Math.round(Number((Math.abs(x) * 100).toPrecision(12))) / 100; }
  function r1(x) { return Math.round(Number((x * 10).toPrecision(12))) / 10; }
  function m2(x) { return "$" + x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  (root.CDT_CALCS = root.CDT_CALCS || {})["construction-draw-schedule-calculator"] = {
    fields: [
      { name: "price", label: "Contract price", min: 0, max: 100000000 },
      { name: "draws", label: "Number of draws", choices: ["2", "3", "4", "5"] },
      { name: "p1", label: "Draw 1 %", min: 0, allowZero: true, optional: true, max: 100 },
      { name: "p2", label: "Draw 2 %", min: 0, allowZero: true, optional: true, max: 100 },
      { name: "p3", label: "Draw 3 %", min: 0, allowZero: true, optional: true, max: 100 },
      { name: "p4", label: "Draw 4 %", min: 0, allowZero: true, optional: true, max: 100 },
      { name: "p5", label: "Draw 5 %", min: 0, allowZero: true, optional: true, max: 100 },
      { name: "cap", label: "Deposit cap", min: 0, allowZero: true, optional: true, max: 100000000 }
    ],
    compute: function (v) {
      var n = Number(v.draws), D = v.price, i;
      var pc = [v.p1, v.p2, v.p3, v.p4, v.p5].map(function (p) { return p / 100; });
      var total = 0;
      for (i = 0; i < n; i++) total += pc[i];
      var ok = Math.abs(total - 1) < 0.0005;
      var raw = pc.map(function (p) { return r2(D * p); });
      var d = ["", "", "", "", ""];
      d[0] = v.cap > 0 ? Math.min(raw[0], v.cap) : raw[0];
      var shift = r2(raw[0] - d[0]);
      d[1] = (n === 2 && ok) ? r2(D - d[0]) : r2(raw[1] + shift);
      var sum = d[0] + d[1];
      for (i = 2; i < n; i++) {
        d[i] = (i === n - 1 && ok) ? r2(D - sum) : raw[i];
        sum += d[i];
      }
      var check = ok ? "OK" : "Schedule adds to " + r1(total * 100) + "%";
      var scheduled = r2(sum);
      var finalDraw = d[n - 1];
      var flags = [];
      if (!ok) flags.push({ level: "warn", text: "Your percents add to " + r1(total * 100) + "%, not 100%. The draws come to " + m2(scheduled) + ", not the " + m2(D) + " price." });
      else flags.push({ level: "good", text: "The percents add to 100%, so the draws add up to the exact contract price." });
      if (shift > 0) flags.push({ level: "good", text: "Your deposit cap moves " + m2(shift) + " from draw 1 to draw 2." });
      if (ok && finalDraw / D > 0.15) flags.push({ level: "warn", text: "The last draw is over 15% of the price. A big final payment held behind a punch list is the hardest one to collect." });
      return {
        out: { d1: d[0], d2: d[1], d3: d[2], d4: d[3], d5: d[4], total: total, check: check, scheduled: scheduled,
               shift: shift, final_draw: finalDraw },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
