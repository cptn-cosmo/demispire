"use strict";

// Demiplane writes every roll on a character sheet to localStorage under
// "<characterId>-dice-history". Content scripts share the page's
// localStorage but don't receive "storage" events for the page's own writes,
// so we poll the key and replay each new roll in TaleSpire.

const SHEET_PATH = /^\/nexus\/[^/]+\/character-sheet\/([^/?#]+)/;
const POLL_MS = 250;

let settings = { enabled: true, viaSymbiote: true, dryRun: false, debug: false };
browser.storage.local.get(settings).then((s) => (settings = { ...settings, ...s }));
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  for (const [key, { newValue }] of Object.entries(changes)) settings[key] = newValue;
});

function debug(...args) {
  if (settings.debug) console.log("[Demispire]", ...args);
}

function openTaleSpire(url) {
  // An anchor click hands the custom scheme to the OS without navigating the
  // sheet away. Firefox asks once per site; tick "Always allow".
  const a = document.createElement("a");
  a.href = url;
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
}

let toastEl;
function toast(lines) {
  toastEl?.remove();
  toastEl = document.createElement("div");
  toastEl.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:2147483647;max-width:420px;padding:10px 14px;" +
    "border-radius:8px;background:#1d1b26;color:#f2eefc;font:13px/1.4 system-ui,sans-serif;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.4);pointer-events:none;white-space:pre-wrap;overflow-wrap:anywhere";
  toastEl.textContent = lines.join("\n");
  document.body.append(toastEl);
  const el = toastEl;
  setTimeout(() => el.remove(), 5000);
}

function forward(entry) {
  const roll = DemispireParse.parseHistoryEntry(entry);
  debug("history entry", entry, "→", roll);
  if (!roll) return;

  const prefix = settings.viaSymbiote ? DemispireParse.SYMBIOTE_PREFIX : DemispireParse.DICE_PREFIX;
  const url = DemispireParse.buildTaleSpireUrl(roll, prefix);
  const summary = `Demiplane ${DemispireParse.describe(roll)}`;
  if (settings.dryRun) {
    toast([summary, `Dry run, not sent: ${url}`]);
    return;
  }
  openTaleSpire(url);
  toast([summary, `→ TaleSpire: ${url}`]);
}

let watchedKey = null;
let lastRaw = null;

function poll() {
  const match = SHEET_PATH.exec(location.pathname);
  const key = match ? `${match[1]}-dice-history` : null;
  if (key !== watchedKey) {
    // New sheet (or left the sheet): take the existing history as baseline.
    watchedKey = key;
    lastRaw = key && localStorage.getItem(key);
    return;
  }
  if (!key) return;

  const raw = localStorage.getItem(key);
  if (raw === lastRaw) return;
  const entry = DemispireParse.newEntry(lastRaw, raw);
  lastRaw = raw;
  if (entry && settings.enabled) forward(entry);
}

setInterval(poll, POLL_MS);
poll();
