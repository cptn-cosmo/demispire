"use strict";

// Pure helpers for the Symbiote, kept free of the TaleSpire API so they can
// run under Node (see test/duality.test.js).

const DemispireDuality = (() => {
  // Chat is rendered with Unity rich text, which takes <b>, <size> and <color=#hex>.
  const COLORS = {
    hope: "#F2C14E",
    fear: "#B07CF0",
    crit: "#6EE7B7",
  };
  const BIG = "130%";

  function outcome(hope, fear) {
    if (hope === fear) return "Critical Success";
    return hope > fear ? "With Hope" : "With Fear";
  }

  // True for groups with exactly one "Hope" and one "Fear" group.
  function isDuality(groups) {
    return groups.filter((g) => g.name === "Hope").length === 1 && groups.filter((g) => g.name === "Fear").length === 1;
  }

  // groups: [{ name, total }] as evaluated by TaleSpire. Returns null unless
  // the roll is a duality roll.
  function summarize(groups) {
    if (!isDuality(groups)) return null;
    const hope = groups.filter((g) => g.name === "Hope");
    const fear = groups.filter((g) => g.name === "Fear");

    const others = groups.filter((g) => g.name !== "Hope" && g.name !== "Fear");
    return {
      label: others.map((g) => g.name).join(" ") || "Duality Roll",
      hope: hope[0].total,
      fear: fear[0].total,
      modifiers: others.map((g) => g.total),
      total: groups.reduce((sum, g) => sum + g.total, 0),
      outcome: outcome(hope[0].total, fear[0].total),
    };
  }

  function signed(n) {
    return `${n < 0 ? "-" : "+"} ${Math.abs(n)}`;
  }

  function outcomeColor(s) {
    if (s.hope === s.fear) return COLORS.crit;
    return s.hope > s.fear ? COLORS.hope : COLORS.fear;
  }

  //   <size=130%><b>Agility</b></size>
  //   Hope 7 + Fear 4 + 1
  //   <size=130%><b>12 With Hope</b></size>
  function chatMessage(s) {
    const color = (hex, text) => `<color=${hex}>${text}</color>`;
    const big = (text) => `<size=${BIG}><b>${text}</b></size>`;
    const mods = s.modifiers.map((m) => ` ${signed(m)}`).join("");
    return [
      big(s.label),
      `${color(COLORS.hope, `Hope ${s.hope}`)} + ${color(COLORS.fear, `Fear ${s.fear}`)}${mods}`,
      big(color(outcomeColor(s), `${s.total} ${s.outcome}`)),
    ].join("\n");
  }

  function plainText(s) {
    const mods = s.modifiers.map((m) => ` ${signed(m)}`).join("");
    return `${s.label}: Hope ${s.hope} + Fear ${s.fear}${mods} = ${s.total} ${s.outcome}`;
  }

  // "Hope:1d12/Fear:1d12/Agility:0d6+1" (the part of a talespire://dice/ URL
  // after "dice/") -> roll descriptors for TS.dice.putDiceInTray.
  function parseRollPath(path) {
    return String(path)
      .split("/")
      .filter(Boolean)
      .map((group) => {
        const i = group.indexOf(":");
        return i < 0
          ? { name: "", roll: group }
          : { name: decodeURIComponent(group.slice(0, i)), roll: group.slice(i + 1) };
      });
  }

  return { outcome, isDuality, summarize, chatMessage, plainText, parseRollPath };
})();

if (typeof module !== "undefined") module.exports = DemispireDuality;
