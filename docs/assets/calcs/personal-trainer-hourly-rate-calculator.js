/* Personal trainer real hourly rate. Same math as the Personal Trainer Session Pricing & Real Hourly Rate Kit
   (Trainer Setup + Yearly Fixed Costs + Real Hourly Rate), for a typical week of one kind of single session.
   Held at the kit's defaults: 48 weeks a year, $0.30 flat card fee per payment, car cost $0.70 a mile, 10 free
   miles then $0.60 a mile travel fee, and the kit's setup and drive minutes for each place. */
(function (root) {
  "use strict";
  function r2(x) { return Math.round(x * 100) / 100; }
  function round6(x) { return Math.round(x * 1e6) / 1e6; }
  function smart(x) {
    var s = Math.abs(x), neg = x < 0 && r2(x) !== 0;
    var t = (r2(x) === Math.round(x))
      ? "$" + Math.round(s).toLocaleString("en-US")
      : "$" + s.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (neg ? "-" : "") + t;
  }
  var PLACES = ["Gym", "Client's home", "Park", "Online"];
  var LENGTHS = ["30 min", "45 min", "60 min"];
  var DEALS = ["Per-session fee", "Flat rent", "Split", "No gym fee"];
  var SETUP = [10, 10, 15, 5], TRAV = [0, 22, 15, 0], MILES = [0, 12, 7, 0];
  var WEEKS = 48, FLAT = 0.30, CARCOST = 0.70, FREE = 10, PERMILE = 0.60;

  (root.CDT_CALCS = root.CDT_CALCS || {})["personal-trainer-hourly-rate-calculator"] = {
    fields: [
      { name: "sessions", label: "Sessions a week", min: 0, max: 80 },
      { name: "length", label: "Session length", choices: LENGTHS },
      { name: "place", label: "Where you train", choices: PLACES },
      { name: "price", label: "Price per session", min: 0, max: 2000 },
      { name: "deal", label: "Gym deal", choices: DEALS },
      { name: "gym_fee", label: "Gym fee per session", min: 0, allowZero: true, optional: true, max: 500 },
      { name: "gym_rent", label: "Gym rent per month", min: 0, allowZero: true, optional: true, max: 20000 },
      { name: "gym_split", label: "Share the gym keeps", min: 0, allowZero: true, optional: true, max: 90 },
      { name: "yearly", label: "Yearly fixed costs", min: 0, max: 100000 },
      { name: "unpaid", label: "Unpaid hours a week", min: 0, allowZero: true, max: 80 },
      { name: "card", label: "Card fee percent", min: 0, allowZero: true, max: 10 },
      { name: "target", label: "Target pay per hour", min: 0, max: 1000 }
    ],
    compute: function (v) {
      var li = LENGTHS.indexOf(v.length) + 1, pi = PLACES.indexOf(v.place);
      var mins = 15 + 15 * li;
      var cardp = Math.min(0.1, Math.max(0, v.card / 100));
      var tfee = (pi === 1 || pi === 2) ? Math.max(0, MILES[pi] - FREE) * PERMILE : 0;
      var car = 2 * MILES[pi] * CARCOST;
      var cardEach = cardp * (v.price + tfee) + FLAT;
      var splitShare = v.deal === "Split" ? Math.min(0.9, v.gym_split / 100) : 0;
      var gymEach = 0;
      if (pi === 0) {
        if (v.deal === "Per-session fee") gymEach = Math.min(500, v.gym_fee);
        else if (v.deal === "Split") gymEach = splitShare * v.price;
      }
      var rent = v.deal === "Flat rent" ? Math.min(20000, v.gym_rent) * 12 : 0;
      var fixedWeek = (v.yearly + rent) / WEEKS;
      var n = v.sessions;
      var client = n * mins / 60, setup = n * SETUP[pi] / 60, drive = n * 2 * TRAV[pi] / 60;
      var hours = client + setup + drive + v.unpaid;
      var share = client / hours;
      var paid = n * (v.price + tfee), card = n * cardEach, gym = n * gymEach, carWeek = n * car;
      var kept = paid - card - gym - carWeek - fixedWeek;
      var pph = kept / hours;
      var tgt = r2(v.target);
      var gymPrice = pi === 0 ? n * v.price : 0;
      var denom = n * v.price * (1 - cardp) - splitShare * gymPrice;
      var rise, risePct = 0;
      if (r2(pph) >= tgt) {
        rise = "You're at or above your target at these prices.";
      } else if (denom <= 0) {
        rise = "Raising prices can't close the gap while the split and card fees take it all.";
      } else {
        var x = (v.target * hours - kept) / denom;
        risePct = Math.ceil(round6(x) * 100 - 1e-9) / 100;
        rise = "Prices about " + Math.round(risePct * 100 + 1e-9) + "% higher would get this same week to " + smart(v.target) + " an hour.";
      }
      var sticker = v.price * 60 / mins;
      var flags = [{ level: r2(pph) < tgt ? "warn" : "good", text: rise }];
      if ((v.deal === "Flat rent" && !v.gym_rent) || (v.deal === "Split" && !v.gym_split) || (v.deal === "Per-session fee" && !v.gym_fee))
        flags.push({ level: "warn", text: "The box for your gym deal is empty, so the gym costs nothing here. Fill it in if you pay one." });
      if (kept < 0) flags.push({ level: "warn", text: "This week loses money once the fees and costs come out." });
      return {
        out: { client: client, setup: setup, drive: drive, admin: v.unpaid, hours: hours, share: share, paid: paid,
               card: card, gym: gym, car: carWeek, fixed: fixedWeek, kept: kept, pph: pph, rise: rise,
               sticker: sticker, rise_pct: risePct },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
