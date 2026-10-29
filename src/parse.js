"use strict";

// Pure helpers that turn a Demiplane dice-history entry into a TaleSpire dice
// URL. No DOM or browser APIs here so the logic can run under Node
// (see test/parse.test.js).
//
// Demiplane stores each sheet's roll history in localStorage under
// "<characterId>-dice-history" as a JSON array, newest first. Relevant shape:
//   {
//     roll: "1d12 + 1d12 + 1d6+1",
//     modifiersParsed: [{ purpose: "add", value: 1 }, { purpose: "misc", value: "Trait Roll" },
//                       { purpose: "misc", value: "Agility" }, ...],
//     result: { total: 19, dice: [{ die: "d12", value: 12, slug: "hope",
//                                   config: { name: "Hope", isNegative: false } }, ...] }
//   }

const DemispireParse = (() => {
  function sides(die) {
    const m = /^d(\d+)$/i.exec(String(die));
    return m ? Number(m[1]) : null;
  }

  function dualityOutcome(hope, fear) {
    if (hope === fear) return "Critical Success";
    return hope > fear ? "With Hope" : "With Fear";
  }

  // Returns null when the entry isn't something we can replay.
  //   { kind: "duality", name, source, hope, fear, outcome, extraDice, modifier, total }
  //   { kind: "generic", name, source, dice, modifier, total }
  // Dice are { sides, sign, slug, value }; value is Demiplane's (unsigned) result.
  function parseHistoryEntry(entry) {
    const rawDice = entry?.result?.dice;
    if (!Array.isArray(rawDice) || !rawDice.length) return null;

    const dice = [];
    for (const d of rawDice) {
      const s = sides(d.die);
      if (!s) return null;
      if (d.is_kept === false) continue;
      dice.push({
        sides: s,
        sign: d.config?.isNegative ? -1 : 1,
        slug: d.slug || d.config?.slug || "",
        value: Math.abs(Number(d.value)),
      });
    }

    const mods = Array.isArray(entry.modifiersParsed) ? entry.modifiersParsed : [];
    const modifier = mods
      .filter((m) => m.purpose === "add" && Number.isFinite(Number(m.value)))
      .reduce((sum, m) => sum + Number(m.value), 0);
    // The first two misc strings are the roll name and its source, e.g. "Trait Roll", "Agility".
    const [name = "Roll", source = ""] = mods
      .filter((m) => m.purpose === "misc" && typeof m.value === "string" && m.value)
      .map((m) => m.value);
    const total = entry.result.total;

    const hope = dice.find((d) => d.slug === "hope");
    const fear = dice.find((d) => d.slug === "fear");
    if (hope && fear) {
      return {
        kind: "duality",
        name,
        source,
        hope: hope.value,
        fear: fear.value,
        outcome: dualityOutcome(hope.value, fear.value),
        extraDice: dice.filter((d) => d !== hope && d !== fear),
        modifier,
        total,
      };
    }
    return { kind: "generic", name, source, dice, modifier, total };
  }

  // Collapses dice into "2d10-1d6+3" form, grouping equal sides and signs.
  function formatTerms(dice, modifier) {
    const counts = new Map();
    for (const d of dice) {
      const key = `${d.sign}:${d.sides}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    let out = "";
    for (const [key, count] of counts) {
      const [sign, s] = key.split(":").map(Number);
      out += `${sign < 0 ? "-" : out ? "+" : ""}${count}d${s}`;
    }
    if (modifier) out += `${modifier < 0 ? "-" : out ? "+" : ""}${Math.abs(modifier)}`;
    return out;
  }

  function groupName(name) {
    return encodeURIComponent(name.replace(/[^A-Za-z0-9 ]/g, "").trim() || "Roll");
  }

  // talespire://dice/Name:expr/Name:expr — "/" keeps each group's total separate,
  // so Hope and Fear can be compared directly in TaleSpire's result.
  function buildTaleSpireUrl(roll) {
    const groups = [];
    if (roll.kind === "duality") {
      groups.push(["Hope", "1d12"], ["Fear", "1d12"]);
      // The bonus group carries the trait name ("Agility:0d6+1"). TaleSpire
      // only accepts constants as a suffix on a die term, so a dice-free bonus
      // rides on zero dice; a +0 trait still gets a group so the name shows up.
      if (roll.extraDice.length) {
        groups.push([roll.source || "Modifier", formatTerms(roll.extraDice, roll.modifier)]);
      } else if (roll.modifier || roll.source) {
        groups.push([roll.source || "Modifier", `0d6${roll.modifier < 0 ? "-" : "+"}${Math.abs(roll.modifier)}`]);
      }
    } else {
      groups.push([roll.source || roll.name, formatTerms(roll.dice, roll.modifier)]);
    }
    return "talespire://dice/" + groups.map(([n, e]) => `${groupName(n)}:${e}`).join("/");
  }

  function describe(roll) {
    const what = [roll.source, roll.name].filter(Boolean).join(" ");
    if (roll.kind === "duality") {
      return `${what}: Hope ${roll.hope} / Fear ${roll.fear} → ${roll.total}, ${roll.outcome}`;
    }
    return `${what}: ${formatTerms(roll.dice, roll.modifier)} → ${roll.total}`;
  }

  // Given the previous and current localStorage strings, returns the newly
  // added/rerolled entry or null. Demiplane caps the history, so a new roll
  // can leave the length unchanged; any change that doesn't shrink it counts.
  function newEntry(prevRaw, nextRaw) {
    if (!nextRaw || nextRaw === prevRaw) return null;
    let next, prev;
    try {
      next = JSON.parse(nextRaw);
      prev = prevRaw ? JSON.parse(prevRaw) : [];
    } catch {
      return null;
    }
    if (!Array.isArray(next) || !next.length) return null;
    if (Array.isArray(prev) && next.length < prev.length) return null; // history cleared/trimmed
    return next[0];
  }

  return { parseHistoryEntry, dualityOutcome, formatTerms, buildTaleSpireUrl, describe, newEntry };
})();

if (typeof module !== "undefined") module.exports = DemispireParse;
