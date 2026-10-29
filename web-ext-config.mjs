// Settings for `npx web-ext build|lint|sign`: package only the Firefox extension.
export default {
  ignoreFiles: ["icons/*.svg", "linux", "symbiote", "test", "web-ext-artifacts", "web-ext-config.mjs", "README.md"],
  build: {
    overwriteDest: true,
  },
};
