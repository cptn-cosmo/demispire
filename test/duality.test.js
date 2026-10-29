"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../symbiote/duality.js");

test("trait roll with hope", () => {
  assert.equal(
    D.summarize([{ name: "Hope", total: 7 }, { name: "Fear", total: 4 }, { name: "Agility", total: 1 }]),
    "Agility: 12, With Hope (Hope 7, Fear 4, Agility +1)",
  );
});

test("negative trait group and fear", () => {
  assert.equal(
    D.summarize([{ name: "Hope", total: 2 }, { name: "Fear", total: 9 }, { name: "Presence", total: -3 }]),
    "Presence: 8, With Fear (Hope 2, Fear 9, Presence -3)",
  );
});

test("matching dice crit, no extra groups", () => {
  assert.equal(
    D.summarize([{ name: "Hope", total: 5 }, { name: "Fear", total: 5 }]),
    "Duality: 10, Critical Success (Hope 5, Fear 5)",
  );
});

test("ignores rolls without exactly one Hope and Fear group", () => {
  assert.equal(D.summarize([{ name: "Improved Hand Runes", total: 17 }]), null);
  assert.equal(D.summarize([{ name: "Hope", total: 5 }]), null);
  assert.equal(D.summarize([{ name: "Hope", total: 5 }, { name: "Hope", total: 2 }, { name: "Fear", total: 3 }]), null);
});
