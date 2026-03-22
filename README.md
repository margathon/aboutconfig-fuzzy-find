# About Config Fuzzy Finder

A small Firefox and Zen browser extension that provides a **popup** to fuzzy-search a **bundled** list of preference names, **copy** a name to the clipboard, and **open** `about:config` so you can paste or filter there.

The default [`data/prefs.json`](data/prefs.json) is generated from **your Zen install’s shipped defaults** (toolkit + browser `pref(...)` lines in `omni.ja`), so it includes Firefox-engine prefs plus Zen-specific names such as `zen.*`. Regenerate after upgrading Zen so names stay in sync with that version.

## Limitations

- **Not** an overlay on the built-in `about:config` page. WebExtensions cannot inject scripts into that page.
- **Bundled names, not live values**: the add-on cannot read your profile. The list is every **declared default** found in the install’s preference JS (typically thousands of names). A few prefs may exist only at runtime and not appear here.
- **No automatic filter URL**: do not rely on old `about:config?filter=` behavior; use the search box inside `about:config` after opening it.

## Load temporarily (Firefox or Zen)

1. Open `about:debugging`.
2. Choose **This Firefox** (or the Zen equivalent).
3. Click **Load Temporary Add-on…**.
4. Select the [`manifest.json`](manifest.json) file in this project folder.

The add-on clears when you close the browser unless you install a signed build.

## Pref list (full list from Zen)

Regenerate [`data/prefs.json`](data/prefs.json) from the Zen binary on your machine (requires `unzip`):

```bash
python3 scripts/extract-prefs-from-zen.py --root /opt/zen-browser-bin -o data/prefs.json
```

If Zen lives elsewhere, set `--root` to that directory (the one containing `omni.ja` and `browser/omni.ja`). You can also set `ZEN_BROWSER_ROOT` and omit `--root`.

To **add or override** entries by hand, edit the same file. Each object looks like:

```json
{
  "name": "example.preference.name",
  "description": "Optional short note shown under the name."
}
```

Only `name` is required. Reload the extension from `about:debugging` after changes.

## Development

Install deps if needed (`bun install`). Use [web-ext](https://github.com/mozilla/web-ext) from this directory. By default, [`web-ext-config.mjs`](web-ext-config.mjs) points `web-ext run` at Zen (`/opt/zen-browser-bin/zen-bin`), not Mozilla Firefox. Override the binary with **`ZEN_BROWSER`** or **`ZEN_BROWSER_BIN`**, or pass **`--firefox=/path/to/zen-bin`** once.

```bash
bun run start
# or: bunx web-ext run
```

To use stock Firefox instead for a session: `bunx web-ext run --firefox=firefox` (or the full path to `firefox`).

## Permissions

- **`tabs`**: open `about:config` in a new tab from the popup.
- **`clipboardWrite`**: copy a preference name to the clipboard.
