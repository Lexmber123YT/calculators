(function (root) {
  "use strict";
  // Same math as the kit's "Price a Home" sheet. Held at kit defaults: payroll extras 12%, car cost $0.70/mile,
  // 12 visits a month (overhead is shared across them), time rates 60 min per 1,000 sq ft, 10 per bedroom, 25 per bathroom.
  var COND = { "Light": 0.85, "Average": 1.0, "Heavy": 1.35 };
  var SERV = { "Standard clean": 1.0, "Deep clean": 1.8, "Move-in or move-out": 2.2 };
  var FREQ = { "Weekly": 0.80, "Every 2 weeks": 0.90, "Monthly": 1.0, "One-time": 1.15 };
  var EXTRAS = 0.12, CPM = 0.70, VISITS = 12;

  (root.CDT_CALCS = root.CDT_CALCS || {})["house-cleaning-price-calculator"] = {
    fields: [
      { name: "sqft", label: "Square feet", max: 20000 },
      { name: "beds", label: "Bedrooms", allowZero: true, integer: true, max: 20 },
      { name: "baths", label: "Bathrooms", allowZero: true, max: 20 },
      { name: "condition", label: "Condition", choices: ["Light", "Average", "Heavy"] },
      { name: "service", label: "Type of clean", choices: ["Standard clean", "Deep clean", "Move-in or move-out"] },
      { name: "freq", label: "How often", choices: ["Weekly", "Every 2 weeks", "Monthly", "One-time"] },
      { name: "pay", label: "Pay per cleaner hour", max: 200 },
      { name: "supplies", label: "Supplies per visit", allowZero: true, max: 500 },
      { name: "miles", label: "Round-trip miles", allowZero: true, max: 500 },
      { name: "overhead", label: "Monthly overhead", allowZero: true, max: 20000 },
      { name: "margin", label: "Profit margin you want (%)", allowZero: true, max: 80 }
    ],
    compute: function (v) {
      var m = v.margin / 100;
      var base = v.sqft / 1000 * 60 + v.beds * 10 + v.baths * 25;
      var minutes = base * COND[v.condition] * SERV[v.service] * FREQ[v.freq];
      var hours = Math.round(minutes / 60 * 100 + 1e-9) / 100;
      var labor = hours * v.pay * (1 + EXTRAS);
      var drive = v.miles * CPM;
      var over = v.overhead / VISITS;
      var cost = labor + v.supplies + drive + over;
      var price = Math.ceil(cost / (1 - m) / 5 - 1e-9) * 5;
      if (!(hours > 0)) return { error: "Those numbers give no cleaning time. Check the size and rooms." };
      var profit = price - cost;
      var flags = [];
      if (v.freq === "One-time") flags.push({ level: "warn", text: "One-time cleans run long. The price includes a 15% time cushion for that." });
      if (m < 0.15) flags.push({ level: "warn", text: "A margin under 15% leaves little room for a slow day or a late client." });
      return { out: { hours: hours, labor: labor, supplies: v.supplies, drive: drive, overhead: over, cost: cost,
                      price: price, profit: profit, margin: price > 0 ? profit / price : 0, perhour: profit / hours }, flags: flags };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
