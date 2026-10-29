"use strict";

const DEFAULTS = { enabled: true, dryRun: true, debug: false };

browser.storage.local.get(DEFAULTS).then((settings) => {
  for (const [key, value] of Object.entries(settings)) {
    const box = document.getElementById(key);
    box.checked = value;
    box.addEventListener("change", () => browser.storage.local.set({ [key]: box.checked }));
  }
});
