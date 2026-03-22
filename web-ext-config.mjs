// Default browser for `web-ext run` (see README). Override with ZEN_BROWSER or ZEN_BROWSER_BIN.
import process from "node:process";

const zenBinary =
  process.env.ZEN_BROWSER_BIN ??
  process.env.ZEN_BROWSER ??
  "/opt/zen-browser-bin/zen-bin";

export default {
  run: {
    // web-ext CLI name — any Gecko desktop binary (here: Zen), not “Mozilla Firefox” only.
    firefox: zenBinary,
  },
};
