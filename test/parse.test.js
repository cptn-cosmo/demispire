"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../src/parse.js");

// Fixtures trimmed from real Demiplane "<characterId>-dice-history" entries.
const die = (die, value, slug, name, isNegative = false) => ({
  die, value, slug, is_kept: true, config: { slug, name, isNegative },
});
const mods = (add, name, source, type) => [
  { value: add, purpose: "add", rollString: `${add < 0 ? "" : "+"}${add}` },
  { value: name, purpose: "misc", rollString: "" },
  { value: source, purpose: "misc", rollString: "" },
  { value: type, purpose: "misc", rollString: "" },
];

const agilityWithHope = {
  type: "single", name: "Custom Roll", roll: "1d12 + 1d12+1",
  modifiersParsed: mods(1, "Trait Roll", "Agility", 0),
  result: { total: 20, dice: [die("d12", 12, "hope", "Hope"), die("d12", 7, "fear", "Fear")] },
};
const agilityAdvantage = {
  type: "single", name: "Custom Roll", roll: "1d12 + 1d12 + 1d6+1",
  modifiersParsed: mods(1, "Trait Roll", "Agility", 0),
  result: {
    total: 19,
    dice: [die("d12", 12, "hope", "Hope"), die("d12", 3, "fear", "Fear"), die("d6", 3, "advantage", "Advantage")],
  },
};
const presenceDisadvantageCrit = {
  type: "single", name: "Custom Roll", roll: "1d12 + 1d12 + 1d6-1",
  modifiersParsed: mods(-1, "Trait Roll", "Presence", 0),
  result: {
    total: 6,
    dice: [
      die("d12", 4, "hope", "Hope"),
      die("d12", 4, "fear", "Fear"),
      die("d6", -1, "disadvantage", "Disadvantage", true),
    ],
  },
};
const handRunesDamage = {
  type: "single", name: "Custom Roll", roll: "1d10 + 1d10+3",
  modifiersParsed: mods(3, "Damage Roll", "Improved Hand Runes", "damage"),
  result: { total: 17, dice: [die("d10", 8, "", ""), die("d10", 6, "", "")] },
};

test("duality outcome", () => {
  assert.equal(P.dualityOutcome(8, 3), "With Hope");
  assert.equal(P.dualityOutcome(2, 9), "With Fear");
  assert.equal(P.dualityOutcome(6, 6), "Critical Success");
});

test("trait roll with hope", () => {
  const roll = P.parseHistoryEntry(agilityWithHope);
  assert.equal(roll.kind, "duality");
  assert.equal(roll.outcome, "With Hope");
  assert.equal(P.describe(roll), "Agility Trait Roll: Hope 12 / Fear 7 → 20, With Hope");
  assert.equal(P.buildTaleSpireUrl(roll), "talespire://dice/Hope:1d12/Fear:1d12/Agility:0d6+1");
});

test("advantage die joins the trait group", () => {
  const roll = P.parseHistoryEntry(agilityAdvantage);
  assert.equal(P.buildTaleSpireUrl(roll), "talespire://dice/Hope:1d12/Fear:1d12/Agility:1d6+1");
});

test("disadvantage die is negated and equal dice crit", () => {
  const roll = P.parseHistoryEntry(presenceDisadvantageCrit);
  assert.equal(roll.outcome, "Critical Success");
  assert.equal(P.buildTaleSpireUrl(roll), "talespire://dice/Hope:1d12/Fear:1d12/Presence:-1d6-1");
});

test("+0 trait still sends its name", () => {
  const roll = P.parseHistoryEntry({ ...agilityWithHope, modifiersParsed: mods(0, "Trait Roll", "Strength", 0) });
  assert.equal(P.buildTaleSpireUrl(roll), "talespire://dice/Hope:1d12/Fear:1d12/Strength:0d6+0");
});

test("duality roll without a source falls back to Modifier", () => {
  const roll = P.parseHistoryEntry({ ...agilityWithHope, modifiersParsed: [{ value: 2, purpose: "add" }] });
  assert.equal(P.buildTaleSpireUrl(roll), "talespire://dice/Hope:1d12/Fear:1d12/Modifier:0d6+2");
});

test("damage roll is named after its source", () => {
  const roll = P.parseHistoryEntry(handRunesDamage);
  assert.equal(roll.kind, "generic");
  assert.equal(P.describe(roll), "Improved Hand Runes Damage Roll: 2d10+3 → 17");
  assert.equal(P.buildTaleSpireUrl(roll), "talespire://dice/Improved%20Hand%20Runes:2d10+3");
});

test("symbiote prefix routes the same groups through the Symbiote", () => {
  const roll = P.parseHistoryEntry(agilityWithHope);
  assert.equal(
    P.buildTaleSpireUrl(roll, P.SYMBIOTE_PREFIX),
    "talespire://symbiote/AQDNSujbTp2_TJziv9464Asa/Hope:1d12/Fear:1d12/Agility:0d6+1",
  );
});

test("newEntry detects new rolls in a capped history", () => {
  const a = JSON.stringify([agilityWithHope, handRunesDamage, agilityAdvantage]);
  const b = JSON.stringify([presenceDisadvantageCrit, agilityWithHope, handRunesDamage]);
  assert.deepEqual(P.newEntry(a, b), presenceDisadvantageCrit);
  assert.equal(P.newEntry(b, b), null);
  assert.deepEqual(P.newEntry(null, JSON.stringify([handRunesDamage])), handRunesDamage);
  assert.equal(P.newEntry(b, JSON.stringify([agilityWithHope])), null); // trimmed
  assert.equal(P.newEntry(b, "not json"), null);
});

test("rejects malformed entries", () => {
  assert.equal(P.parseHistoryEntry(null), null);
  assert.equal(P.parseHistoryEntry({ result: { dice: [] } }), null);
  assert.equal(P.parseHistoryEntry({ result: { dice: [{ die: "dX", value: 1 }] } }), null);
});
