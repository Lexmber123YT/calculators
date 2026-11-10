/* Lawn mowing price per visit. Same steps as the Lawn Care Pricing & Bid Kit (Bid a Yard + Your Numbers):
   mow minutes = sq ft / mower rate x 60 x obstacles x slope
   on site     = max(mow, (mow + trim/edge/blow) / crew)
   cost        = (on site + drive) x crew x pay x (1 + extras) + fuel + equipment (on site) + truck (drive) + overhead per visit
   price       = cost / (1 - margin), rounded UP to the next $5, never under the minimum charge.
   Held at the kit's defaults: payroll extras 12%, fuel $4.50/hr, equipment $9/hr, truck $14/drive-hr,
   180 visits a month, $45 minimum, no gate slowdown, weekly mowing. */
(function (root) {
  "use strict";
  var MOWERS = {
    "21-inch push mower": 12000, "36-inch walk-behind": 30000, "48-inch stand-on": 50000,
    "52-inch zero-turn": 65000, "60-inch zero-turn": 80000, "72-inch zero-turn": 100000
  };
  var OBST = { "Open lawn": 1.0, "Some beds and trees": 1.15, "Lots to mow around": 1.35 };
  var SLOPE = { "Flat": 1.0, "Rolling": 1.15, "Steep hill": 1.4 };
  var EXTRAS = 0.12, FUEL = 4.5, EQUIP = 9, TRUCK = 14, VISITS = 180, MINIMUM = 45;
  function keys(o) { return Object.keys(o); }
  function ceil5(x) { return Math.ceil(Math.round(x * 1e6) / 1e6 / 5) * 5; }
  function round2(x) { return Math.round(x * 100) / 100; }
  (root.CDT_CALCS = root.CDT_CALCS || {})["lawn-mowing-price-calculator"] = {
    fields: [
      { name: "sqft", label: "Lawn square feet", min: 0, max: 5000000 },
      { name: "mower", label: "Mower", choices: keys(MOWERS) },
      { name: "obstacles", label: "Obstacles", choices: keys(OBST) },
      { name: "slope", label: "Slope", choices: keys(SLOPE) },
      { name: "otherMin", label: "Trim, edge and blow minutes", min: 0, max: 600, allowZero: true },
      { name: "drive", label: "Drive minutes", min: 0, max: 240, allowZero: true },
      { name: "crew", label: "Crew size", min: 1, max: 20, integer: true },
      { name: "pay", label: "Pay per labor hour", min: 0, max: 500 },
      { name: "overhead", label: "Monthly overhead", min: 0, max: 1000000, allowZero: true },
      { name: "margin", label: "Profit margin (%)", min: 0, max: 90, allowZero: true }
    ],
    compute: function (v) {
      var margin = v.margin / 100;
      var mult = OBST[v.obstacles] * SLOPE[v.slope];
      var mow = v.sqft / MOWERS[v.mower] * 60 * mult;
      var onsite = Math.max(mow, (mow + v.otherMin) / v.crew);
      var manhours = round2((onsite + v.drive) * v.crew / 60);
      var laborHr = v.pay * (1 + EXTRAS);
      var cost = (onsite + v.drive) / 60 * v.crew * laborHr + onsite / 60 * FUEL + onsite / 60 * EQUIP +
        v.drive / 60 * TRUCK + v.overhead / VISITS;
      var marginPrice = ceil5(cost / (1 - margin));
      var price = Math.max(marginPrice, MINIMUM);
      var profit = price - cost;
      var flags = [];
      if (marginPrice < MINIMUM)
        flags.push({ level: "good", text: "The math came out under $" + MINIMUM + ", so the price shown is a $" + MINIMUM + " minimum charge. Small stops still cost you a drive and an unload." });
      if (manhours > 0 && price / manhours < 30)
        flags.push({ level: "warn", text: "That works out to under $30 per labor hour after drive time. Check your numbers, or the price may not be enough." });
      if (v.drive === 0)
        flags.push({ level: "warn", text: "You typed 0 drive minutes. Most routes lose time between stops." });
      return {
        out: {
          mow_min: mow, onsite: onsite, manhours: manhours, cost: cost, margin_price: marginPrice,
          suggested: price, profit: profit, pct: profit / price, per_mh: manhours > 0 ? price / manhours : 0
        },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
