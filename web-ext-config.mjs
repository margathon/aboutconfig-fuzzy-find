// web-ext `run` defaults (see README).
import process from "node:process";

const zenBinary =
  process.env.ZEN_BROWSER_BIN ??
  process.env.ZEN_BROWSER ??
  "/opt/zen-browser-bin/zen-bin";

export default {
  run: {
    // web-ext CLI name — any Gecko desktop binary (here: Zen).
    firefox: zenBinary,
    // Fresh web-ext profiles otherwise rerun Zen’s welcome flow.
    pref: ["zen.welcome-screen.seen=true"],
  },
};
