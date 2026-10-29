"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../symbiote/duality.js");

const groups = (hope, fear, ...others) =>
  [{ name: "Hope", total: hope }, { name: "Fear", total: fear }].concat(others.map(([name, total]) => ({ name, total })));

test("trait roll with hope", () => {
  const s = D.summarize(groups(7, 4, ["Agility", 1]));
  assert.equal(D.plainText(s), "Agility: Hope 7 + Fear 4 + 1 = 12 With Hope");
  assert.equal(
    D.chatMessage(s),
    "<size=130%><b>Agility</b></size>\n" +
      "<color=#F2C14E>Hope 7</color> + <color=#B07CF0>Fear 4</color> + 1\n" +
      "<size=130%><b><color=#F2C14E>12 With Hope</color></b></size>",
  );
});

test("negative modifier, with fear", () => {
  const s = D.summarize(groups(2, 9, ["Presence", -3]));
  assert.equal(D.plainText(s), "Presence: Hope 2 + Fear 9 - 3 = 8 With Fear");
  assert.match(D.chatMessage(s), /<color=#B07CF0>8 With Fear<\/color>/);
});

test("matching dice crit, no extra groups", () => {
  const s = D.summarize(groups(5, 5));
  assert.equal(D.plainText(s), "Duality Roll: Hope 5 + Fear 5 = 10 Critical Success");
  assert.match(D.chatMessage(s), /^<size=130%><b>Duality Roll<\/b><\/size>\n/);
  assert.match(D.chatMessage(s), /<color=#6EE7B7>10 Critical Success<\/color>/);
});

test("ignores rolls without exactly one Hope and Fear group", () => {
  assert.equal(D.summarize([{ name: "Improved Hand Runes", total: 17 }]), null);
  assert.equal(D.summarize([{ name: "Hope", total: 5 }]), null);
  assert.equal(D.summarize(groups(5, 3, ["Hope", 2])), null);
});

test("parses symbiote URL payloads into roll descriptors", () => {
  const groups = D.parseRollPath("Hope:1d12/Fear:1d12/Improved%20Hand%20Runes:0d6+3");
  assert.deepEqual(groups, [
    { name: "Hope", roll: "1d12" },
    { name: "Fear", roll: "1d12" },
    { name: "Improved Hand Runes", roll: "0d6+3" },
  ]);
  assert.equal(D.isDuality(groups), true);
  assert.equal(D.isDuality(D.parseRollPath("Improved%20Small%20Dagger:2d8+2")), false);
});
