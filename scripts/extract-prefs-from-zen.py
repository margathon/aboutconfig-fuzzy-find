#!/usr/bin/env python3
"""
Extract preference names from a Zen (Firefox-based) install by parsing
defaults shipped inside omni.ja archives and on-disk defaults/pref/*.js.

Requires the `unzip` CLI (Mozilla omni.ja is a zip with quirks; stdlib
zipfile often fails on it).

Usage:
  ZEN_BROWSER_ROOT=/opt/zen-browser-bin ./scripts/extract-prefs-from-zen.py
  ./scripts/extract-prefs-from-zen.py --root /opt/zen-browser-bin -o data/prefs.json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys

PREF_LINE = re.compile(
    r"^\s*(?:sticky_|locked_)?pref\s*\(\s*\"([^\"]+)\"",
    re.MULTILINE,
)

# Members to read from each archive (paths as stored in the jar).
TOOLKIT_OMNI_MEMBERS = (
    "greprefs.js",
    "defaults/pref/PdfJsDefaultPrefs.js",
)

BROWSER_OMNI_MEMBERS = (
    "defaults/preferences/firefox.js",
    "defaults/preferences/firefox-l10n.js",
    "defaults/preferences/firefox-branding.js",
    "defaults/preferences/debugger.js",
)


def default_zen_root() -> str | None:
    for env in ("ZEN_BROWSER_ROOT", "ZEN_BROWSER"):
        v = os.environ.get(env)
        if v and os.path.isdir(v):
            return v
    for p in ("/opt/zen-browser-bin", "/usr/lib/zen-browser"):
        if os.path.isdir(p):
            return p
    return None


def unzip_p(archive: str, member: str) -> str:
    p = subprocess.run(
        ["unzip", "-p", archive, member],
        capture_output=True,
    )
    # unzip often exits 2 with warnings but still prints the file.
    if p.returncode not in (0, 2) or not p.stdout:
        err = p.stderr.decode("utf-8", "replace") if p.stderr else ""
        raise RuntimeError(
            f"unzip failed (code {p.returncode}) for {archive}!{member}: {err[:300]}"
        )
    return p.stdout.decode("utf-8", "replace")


def collect_from_text(text: str) -> set[str]:
    return set(PREF_LINE.findall(text))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract pref names from a Zen browser installation."
    )
    parser.add_argument(
        "--root",
        metavar="DIR",
        help="Zen install root (e.g. /opt/zen-browser-bin). "
        "Default: $ZEN_BROWSER_ROOT or /opt/zen-browser-bin if present.",
    )
    parser.add_argument(
        "-o",
        "--output",
        metavar="FILE",
        help="Write prefs JSON here (default: stdout).",
    )
    args = parser.parse_args()

    root = args.root or default_zen_root()
    if not root:
        print(
            "Could not find Zen install. Set --root or ZEN_BROWSER_ROOT.",
            file=sys.stderr,
        )
        return 1

    omni = os.path.join(root, "omni.ja")
    browser_omni = os.path.join(root, "browser", "omni.ja")
    channel = os.path.join(root, "defaults", "pref", "channel-prefs.js")

    names: set[str] = set()

    if not os.path.isfile(omni):
        print(f"Missing {omni}", file=sys.stderr)
        return 1
    if not os.path.isfile(browser_omni):
        print(f"Missing {browser_omni}", file=sys.stderr)
        return 1

    for member in TOOLKIT_OMNI_MEMBERS:
        try:
            names.update(collect_from_text(unzip_p(omni, member)))
        except RuntimeError as e:
            print(str(e), file=sys.stderr)

    for member in BROWSER_OMNI_MEMBERS:
        try:
            names.update(collect_from_text(unzip_p(browser_omni, member)))
        except RuntimeError as e:
            print(str(e), file=sys.stderr)

    if os.path.isfile(channel):
        names.update(collect_from_text(open(channel, encoding="utf-8", errors="replace").read()))

    out = [{"name": n} for n in sorted(names)]
    payload = json.dumps(out, indent=2, ensure_ascii=False) + "\n"

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(payload)
        print(f"Wrote {len(out)} prefs to {args.output}", file=sys.stderr)
    else:
        sys.stdout.write(payload)

    return 0


if __name__ == "__main__":
    sys.exit(main())
