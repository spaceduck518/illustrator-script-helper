# Script Helper for Adobe Illustrator

A small Illustrator panel that watches a folder for `.jsx` scripts and runs them with one click. It replaces the usual *File → Scripts → Other Script… → browse* routine.

New scripts, for example ones you just downloaded or saved from your editor, show up at the top of the list right away.

## Features

- **Folder watching.** The panel watches a folder you choose, optionally with its subfolders. New or changed `.jsx` files appear at the top within a fraction of a second.
- **Running scripts.** **▶ Run** works exactly like *File → Scripts*: on the active document and the active artboard. Relative paths such as `#include` resolve to the script's own folder.
- **Result line.** It shows the run time, or the error with its line number. It also tells you when a new script has appeared.
- **Right-click menu:**
  - Run
  - Open in editor
  - Show in folder
  - Copy path
  - **Move to project folder**: moves the script into the folder of the active `.ai` file
- **Filter box** to search long lists.
- **Settings popup** with the watched folder, subfolders, editor, language and theme.
- **Language:** English or German. By default the panel follows Illustrator's UI language and uses English for every language other than German.
- **Theme:** follows Illustrator by default, or set to light or dark.

## Requirements

- Adobe Illustrator 2021 (25.0) or newer.
- Windows. It is developed and tested there. macOS should work but has not been tested yet.

## Installation

1. Download or clone this repository into the CEP extensions folder. Name the folder `com.scripthelper.panel.extension`.
   - Windows (current user, no admin rights needed): `%APPDATA%\Adobe\CEP\extensions\`
   - macOS: `~/Library/Application Support/Adobe/CEP/extensions/`

   ```
   git clone https://github.com/spaceduck518/illustrator-script-helper.git com.scripthelper.panel.extension
   ```

2. The extension is not signed, so CEP has to be allowed to load unsigned extensions. Turn on `PlayerDebugMode` for the CSXS versions your Illustrator uses (11 and 12 cover current versions):

   Windows:
   ```
   reg add HKCU\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f
   reg add HKCU\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1 /f
   ```
   macOS:
   ```
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   defaults write com.adobe.CSXS.12 PlayerDebugMode 1
   ```

3. Restart Illustrator and open **Window → Extensions → Script Helper**.

On first start the settings open automatically. Choose the folder to watch there, for example your Downloads folder.

## Configuration

The settings popup writes a small JSON file. You can also edit it by hand; the panel picks up changes automatically.

- Windows: `%APPDATA%\ScriptHelper\config.json`
- macOS: `~/Library/Application Support/ScriptHelper/config.json`

```json
{
  "watchFolder": "C:\\Users\\me\\Downloads",
  "includeSubfolders": false,
  "editor": "",
  "language": "auto",
  "theme": "auto"
}
```

| Key | Values |
| --- | --- |
| `watchFolder` | Folder to watch. Empty until you choose one. |
| `includeSubfolders` | `true` / `false` |
| `editor` | Program for *Open in editor*, e.g. the path to `Code.exe`. Empty = Notepad (Windows) / TextEdit (macOS). |
| `language` | `auto`, `en`, `de` |
| `theme` | `auto`, `light`, `dark` |

The panel never uses the `.jsx` file association for *Open in editor*. That association often points to Illustrator itself, so "open" would run the script instead.

## Files

| File | Purpose |
| --- | --- |
| `CSXS/manifest.xml` | Extension manifest |
| `index.html` | Panel UI and styles |
| `main.js` | Panel logic: list, watching, menu, settings |
| `scanner.js` | Finds `.jsx` files |
| `config.js` | Reads and writes `config.json` |
| `i18n.js` | English and German texts |
| `hostscript.jsx` | ExtendScript side: runs scripts, finds the document folder |
| `CSInterface.js` | Adobe's CEP library (see below) |

## License

MIT, see [LICENSE](LICENSE).

`CSInterface.js` is © Adobe and comes from Adobe's [CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources). It is included unchanged, under Adobe's terms.
