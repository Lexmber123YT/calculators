/* Home daycare time-space percentage. Same steps as the Home Daycare Time-Space & Tax Deduction Kit
   (Hours Log > Time Percent > Space Percent > Home Costs):
   Time %  = business hours in the year / 8,760 (a full year, capped at 100%)
   Excl %  = rooms used only for the business / whole home (count in full)
   Shared% = shared rooms used for care / whole home (capped at what is left after the exclusive rooms)
   Share   = Excl % + Shared % x Time %
   Home costs x Share = the part of the home costs counted. */
(function (root) {
  "use strict";
  var HOURS_YEAR = 8760;
  function r2(x) { return Math.round(x * 100) / 100; }
  (root.CDT_CALCS = root.CDT_CALCS || {})["home-daycare-time-space-percentage"] = {
    fields: [
      { name: "childHours", label: "Hours children are here per week", min: 0, max: 168, allowZero: true },
      { name: "workHours", label: "Work hours per week with no children here", min: 0, max: 168, allowZero: true },
      { name: "weeks", label: "Weeks you provide care", min: 1, max: 53, integer: true },
      { name: "homeSqft", label: "Total square feet of your home", min: 1, max: 100000 },
      { name: "exclSqft", label: "Square feet used only for the business", min: 0, max: 100000, allowZero: true },
      { name: "sharedSqft", label: "Square feet of shared rooms used for care", min: 0, max: 100000, allowZero: true },
      { name: "costs", label: "Yearly home costs", min: 0, max: 100000000 }
    ],
    compute: function (v) {
      if (v.childHours + v.workHours > 168)
        return { error: "Hours with children plus work hours can't be more than 168 in one week." };
      if (v.exclSqft + v.sharedSqft > v.homeSqft)
        return { error: "The rooms add up to more than your home. Check the square feet." };
      var bizHours = v.weeks * (v.childHours + v.workHours);
      var time = Math.min(1, bizHours / HOURS_YEAR);
      var timeC = Math.min(1, v.weeks * v.childHours / HOURS_YEAR);
      var excl = Math.min(1, v.exclSqft / v.homeSqft);
      var shared = Math.min(1 - excl, v.sharedSqft / v.homeSqft);
      var space = excl + shared;
      var sharedTime = shared * time;
      var share = excl + sharedTime;
      var shareC = excl + shared * timeC;
      var addedPct = share - shareC;
      var flags = [];
      if (v.exclSqft > 0)
        flags.push({ level: "warn", text: "A room counts in full only if nobody uses it for anything else, evenings and weekends included. If the family uses it, count it as shared." });
      if (v.workHours === 0)
        flags.push({ level: "warn", text: "You typed 0 work hours. Cleaning, meal prep, planning and paperwork done with no children here can add to your time. Ask your preparer what counts." });
      if (share === 0)
        flags.push({ level: "warn", text: "Your share comes out at 0%, so no home costs are counted. Check the room numbers." });
      return {
        out: {
          bizHours: bizHours, time: time, space: space, excl: excl, shared: shared, sharedTime: sharedTime,
          share: share, deduction: r2(v.costs * share), addedPct: addedPct, added: r2(v.costs * addedPct)
        },
        flags: flags
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
