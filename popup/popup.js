"use strict";

const DEFAULTS = { enabled: true, viaSymbiote: true, dryRun: false, debug: false };

browser.storage.local.get(DEFAULTS).then((settings) => {
  for (const [key, value] of Object.entries(settings)) {
    const box = document.getElementById(key);
    box.checked = value;
    box.addEventListener("change", () => browser.storage.local.set({ [key]: box.checked }));
  }
});
