"use strict";

// Pure helpers for the Symbiote, kept free of the TaleSpire API so they can
// run under Node (see test/duality.test.js).

const DemispireDuality = (() => {
  function outcome(hope, fear) {
    if (hope === fear) return "Critical Success";
    return hope > fear ? "With Hope" : "With Fear";
  }

  // groups: [{ name, total }] as evaluated by TaleSpire. Returns null unless
  // the roll has exactly one "Hope" and one "Fear" group.
  //   "Agility: 12, With Hope (Hope 7, Fear 4, Agility +1)"
  function summarize(groups) {
    const hope = groups.filter((g) => g.name === "Hope");
    const fear = groups.filter((g) => g.name === "Fear");
    if (hope.length !== 1 || fear.length !== 1) return null;

    const others = groups.filter((g) => g.name !== "Hope" && g.name !== "Fear");
    const total = groups.reduce((sum, g) => sum + g.total, 0);
    const label = others.map((g) => g.name).join(" ") || "Duality";
    const parts = [`Hope ${hope[0].total}`, `Fear ${fear[0].total}`].concat(
      others.map((g) => `${g.name} ${g.total < 0 ? "" : "+"}${g.total}`),
    );
    return `${label}: ${total}, ${outcome(hope[0].total, fear[0].total)} (${parts.join(", ")})`;
  }

  return { outcome, summarize };
})();

if (typeof module !== "undefined") module.exports = DemispireDuality;
