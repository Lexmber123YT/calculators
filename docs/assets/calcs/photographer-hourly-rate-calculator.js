(function (root) {
  "use strict";
  // Same math as the Photographer Pricing & Real Hourly Rate Kit (Session Rate Check).
  // Held at the kit's defaults: card fees 3%, driving $0.70 a mile, tax set-aside 28%.
  // Editing hours are typed here; the kit swaps in your Editing Time Log average once it has 3 galleries.
  var CARD = 0.03, MILE = 0.70, TAX = 0.28;
  (root.CDT_CALCS = root.CDT_CALCS || {})["photographer-hourly-rate-calculator"] = {
    fields: [
      { name: "fee", label: "Session fee", max: 100000 },
      { name: "emails", label: "Emails and planning hours", max: 200, allowZero: true },
      { name: "travel", label: "Travel hours", max: 200, allowZero: true },
      { name: "shoot", label: "Shooting hours", max: 200 },
      { name: "delivery", label: "Delivery hours", max: 200, allowZero: true },
      { name: "edit", label: "Culling and editing hours", max: 200, allowZero: true },
      { name: "miles", label: "Miles driven", max: 5000, allowZero: true },
      { name: "other", label: "Other direct costs", max: 100000, allowZero: true },
      { name: "overhead", label: "Yearly costs, per session", max: 100000, allowZero: true },
      { name: "target", label: "Hourly rate you want", max: 1000 }
    ],
    compute: function (v) {
      var hours = v.emails + v.travel + v.shoot + v.delivery + v.edit;
      var milecost = v.miles * MILE, card = v.fee * CARD;
      var direct = milecost + v.other + card;
      var realhr = (v.fee - direct) / hours;
      var check = realhr < 0 ? "Loses money" : (realhr < v.target ? "Under target" : "OK");
      var taxamt = Math.max(0, v.fee - direct - v.overhead) * TAX;
      var take = v.fee - direct - v.overhead - taxamt;
      var feeneed = (v.target * hours + milecost + v.other) / (1 - CARD);
      var flags = [];
      if (check === "Loses money") flags.push({ level: "warn", text: "After direct costs this session loses money." });
      else if (check === "Under target") flags.push({ level: "warn", text: "Under your target rate. A fee of about $" + Math.ceil(feeneed) + " would reach it with these hours." });
      else flags.push({ level: "good", text: "This session pays at or above your target rate for every hour it takes." });
      if (v.edit + v.emails + v.travel + v.delivery > 3 * v.shoot)
        flags.push({ level: "warn", text: "Most of this session's hours happen away from the camera. That is where the rate usually hides." });
      return { out: {
        hours: hours, milecost: milecost, card: card, direct: direct, realhr: realhr, check: check,
        taxamt: taxamt, takehome: take, takehr: take / hours, feeneed: feeneed
      }, flags: flags };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
