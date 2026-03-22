# About Config Fuzzy Finder

A small Firefox and Zen browser extension that provides a **popup** to fuzzy-search a **bundled** list of preference names, **copy** a name to the clipboard, and **open** `about:config` so you can paste or filter there.

## Limitations

- **Not** an overlay on the built-in `about:config` page. WebExtensions cannot inject scripts into that page.
- **No live pref list**: the extension cannot read or enumerate your full profile preferences. Results come only from [`data/prefs.json`](data/prefs.json) shipped with the add-on.
- **No automatic filter URL**: do not rely on old `about:config?filter=` behavior; use the search box inside `about:config` after opening it.

## Load temporarily (Firefox or Zen)

1. Open `about:debugging`.
2. Choose **This Firefox** (or the Zen equivalent).
3. Click **Load Temporary Add-on…**.
4. Select the [`manifest.json`](manifest.json) file in this project folder.

The add-on clears when you close the browser unless you install a signed build.

## Extending the pref list

Edit [`data/prefs.json`](data/prefs.json). Each entry is an object:

```json
{
  "name": "example.preference.name",
  "description": "Optional short note shown under the name."
}
```

Only `name` is required. Reload the extension from `about:debugging` after changes.

## Development

Optional: use [web-ext](https://github.com/mozilla/web-ext) (`web-ext run`) for a tighter dev loop; not required for the first iteration.

## Permissions

- **`tabs`**: open `about:config` in a new tab from the popup.
- **`clipboardWrite`**: copy a preference name to the clipboard.
