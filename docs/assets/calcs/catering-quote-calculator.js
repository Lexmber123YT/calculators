/* Catering quote per guest. Same math as the Food Truck Catering Quote, Deposit & Balance Tracker (Catering Quote tab).
   Held at the kit's defaults: deposit 30%, card and app fees 3%, helper pay $17 an hour, 1.5 extra helper hours for
   set-up and clean-up, 3 hours prep and 1.5 hours clean-up for you, 35 mph driving, $1.25 a mile truck cost,
   30 free miles then $2 a mile travel fee, no extras. */
(function (root) {
  "use strict";
  function r2(x) { var s = x < 0 ? -1 : 1; return s * Math.round(Number((Math.abs(x) * 100).toPrecision(12))) / 100; }
  function up(x) { var y = Number(x.toPrecision(12)); return y >= 0 ? Math.ceil(y) : -Math.ceil(-y); }
  function m2(x) { return "$" + x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var DEP = 0.30, CARD = 0.03, WAGE = 17, HELPX = 1.5, PREP = 3, CLEAN = 1.5, SPEED = 35, MPC = 1.25, FREE = 30, FEEMILE = 2;

  (root.CDT_CALCS = root.CDT_CALCS || {})["catering-quote-calculator"] = {
    fields: [
      { name: "guests", label: "Guests", min: 0, max: 2000, integer: true },
      { name: "price", label: "Price per guest", min: 0, max: 200 },
      { name: "cost", label: "Food and packaging cost per guest", min: 0, allowZero: true, max: 200 },
      { name: "minimum", label: "Minimum spend", min: 0, allowZero: true, max: 100000 },
      { name: "helpers", label: "Helpers", min: 0, allowZero: true, max: 20, integer: true },
      { name: "hours", label: "Hours on site", min: 0, max: 48 },
      { name: "miles", label: "Round-trip miles", min: 0, allowZero: true, max: 2000 },
      { name: "tax", label: "Sales tax rate", min: 0, allowZero: true, max: 20 },
      { name: "target", label: "Target profit per hour", min: 0, max: 1000 }
    ],
    compute: function (v) {
      var tax = v.tax / 100;
      var food = r2(Math.max(v.guests * v.price, v.minimum));
      var travel = v.miles > FREE ? r2((v.miles - FREE) * FEEMILE) : 0;
      var R = r2(food + travel);
      var S = r2(R * tax);
      var T = R + S;
      var dep = r2(T * DEP);
      var per = R / v.guests;
      var fc = r2(v.guests * v.cost);
      var staff = r2(v.helpers * WAGE * (v.hours + HELPX));
      var drive = r2(v.miles * MPC);
      var card = r2(T * CARD);
      var profit = R - fc - staff - drive - card;
      var hrs = v.hours + PREP + CLEAN + v.miles / SPEED;
      var perhr = profit / hrs;
      var kk = 1 - (1 + tax) * CARD;
      var low = up((v.target * hrs + fc + staff + drive) / kk + 0.05);
      var under = perhr < v.target;
      var verdict = under ? (profit < 0 ? "Loses money: " : "Under your target: ") + "quote at least " + m2(low) + " before tax"
                          : "Clears your " + m2(v.target) + " an hour target";
      var minGuests = v.minimum > 0 ? up(v.minimum / v.price) : "";
      var priceAt = under ? up((low - travel) / v.guests * 4) / 4 : "";
      var flags = [];
      if (v.guests * v.price < v.minimum) flags.push({ level: "good", text: "Your minimum spend sets the food charge: " + v.guests + " guests at " + m2(v.price) + " come to " + m2(v.guests * v.price) + "." });
      if (under) flags.push({ level: "warn", text: verdict + ". That is about " + m2(priceAt) + " a guest." });
      else flags.push({ level: "good", text: verdict + "." });
      return {
        out: { food: food, travel: travel, R: R, S: S, T: T, dep: dep, per: per, fc: fc, staff: staff, drive: drive,
               card: card, profit: profit, hrs: hrs, perhr: perhr, verdict: verdict, minguests: minGuests,
               price_at: priceAt, lowest: low },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
