// ---------------------------------------------------------------------------
// Script Helper – Texte Deutsch / Englisch.
// In index.html: data-i18n="key" (Text), data-i18n-title, data-i18n-placeholder.
// Im Code: ShI18n.t("key", { name: ... }) ersetzt {name}.
// ---------------------------------------------------------------------------
(function (root) {
    "use strict";

    const dict = {
        de: {
            settings: "Einstellungen",
            close: "Schließen",
            filter: "Filtern …",

            menuRun: "Ausführen",
            menuEdit: "Im Editor öffnen",
            menuReveal: "Im Ordner zeigen",
            menuMove: "In Projektordner verschieben",
            menuMoveTitle: "In den Ordner der aktiven Illustrator-Datei verschieben",
            menuCopy: "Pfad kopieren",

            lblFolder: "Überwachter Ordner",
            browseFolder: "Ordner wählen",
            lblSub: "Unterordner einbeziehen",
            lblEditor: "Editor für „Im Editor öffnen“",
            editorPlaceholder: "leer = Standard-Editor",
            browseEditor: "Programm wählen",
            hintEditorWin: "z. B. Code.exe oder Notepad++. Leer = Windows-Editor.",
            hintEditorMac: "z. B. Visual Studio Code.app. Leer = TextEdit.",
            lblLanguage: "Sprache",
            langAuto: "Automatisch (wie Illustrator)",
            lblTheme: "Design",
            themeAuto: "Wie Illustrator",
            themeLight: "Hell",
            themeDark: "Dunkel",
            save: "Speichern",
            cancel: "Abbrechen",
            savedIn: "Gespeichert in",
            cfgFileHint: "Änderungen an der Datei werden automatisch übernommen.",

            dlgFolder: "Zu überwachenden Ordner wählen",
            dlgEditor: "Editor-Programm wählen",
            errNoFolder: "Bitte einen Ordner angeben.",
            errNotDir: "Kein Ordner: {p}",
            errFolderMissing: "Ordner nicht gefunden: {p}",
            errEditorMissing: "Editor nicht gefunden: {p}",
            cfgBroken: "config.json ist fehlerhaft: {detail}",
            cfgSaveFailed: "config.json konnte nicht gespeichert werden: {detail}",
            cfgBrokenReplace: "Speichern ersetzt die Datei.",

            runBtn: "▶ Ausführen",
            runBtnTitle: "{name} ausführen",
            runStill: "Es läuft noch: {name}",
            running: "▶ {name} läuft …",
            runOk: "✓ {name} ausgeführt ({ms} ms)",
            runErr: "✗ {name}: {msg}",
            errLine: "{msg} (Zeile {line})",
            errLineFile: "{msg} (Zeile {line} in {file})",
            notFound: "Datei nicht gefunden: {p}",
            onlyInAi: "Nur in Illustrator möglich.",

            moveRunning: "✗ {name} läuft gerade und kann nicht verschoben werden.",
            notMoved: "✗ Nicht verschoben: {msg}",
            noDoc: "Kein Dokument geöffnet.",
            unsaved: "„{name}“ wurde noch nicht gespeichert.",
            alreadyThere: "{name} liegt schon im Projektordner.",
            movedTo: "✓ {name} verschoben nach {dir}",
            movedAs: "✓ {name} als {newName} verschoben nach {dir}",
            moveFailed: "✗ Verschieben fehlgeschlagen: {msg}",

            launchFailed: "Start fehlgeschlagen: {cmd} ({err})",
            copied: "Pfad kopiert.",
            copyFailed: "Kopieren nicht möglich.",

            noMatch: "Kein Treffer für „{q}“.",
            noScripts: "Keine .jsx-Dateien gefunden.",
            noFolder: "Noch kein Ordner gewählt.",
            chooseFolderBtn: "Ordner wählen …",
            count: "{n} Skript(e)",
            truncated: " (Liste gekürzt)",
            watched: "überwacht",
            polling: "Abfrage alle {s} s",
            folderUnreadable: "Ordner nicht lesbar: {p} ({code})",
            newOne: "＋ Neues Skript: {name}",
            newMany: "＋ {n} neue Skripte: {names}",

            justNow: "gerade eben",
            minAgo: "vor {n} Min.",
            today: "heute {t}"
        },
        en: {
            settings: "Settings",
            close: "Close",
            filter: "Filter …",

            menuRun: "Run",
            menuEdit: "Open in editor",
            menuReveal: "Show in folder",
            menuMove: "Move to project folder",
            menuMoveTitle: "Move into the folder of the active Illustrator file",
            menuCopy: "Copy path",

            lblFolder: "Watched folder",
            browseFolder: "Choose folder",
            lblSub: "Include subfolders",
            lblEditor: "Editor for “Open in editor”",
            editorPlaceholder: "empty = default editor",
            browseEditor: "Choose program",
            hintEditorWin: "e.g. Code.exe or Notepad++. Empty = Windows Notepad.",
            hintEditorMac: "e.g. Visual Studio Code.app. Empty = TextEdit.",
            lblLanguage: "Language",
            langAuto: "Automatic (like Illustrator)",
            lblTheme: "Theme",
            themeAuto: "Like Illustrator",
            themeLight: "Light",
            themeDark: "Dark",
            save: "Save",
            cancel: "Cancel",
            savedIn: "Stored in",
            cfgFileHint: "Changes to the file are applied automatically.",

            dlgFolder: "Choose folder to watch",
            dlgEditor: "Choose editor program",
            errNoFolder: "Please enter a folder.",
            errNotDir: "Not a folder: {p}",
            errFolderMissing: "Folder not found: {p}",
            errEditorMissing: "Editor not found: {p}",
            cfgBroken: "config.json is invalid: {detail}",
            cfgSaveFailed: "Could not save config.json: {detail}",
            cfgBrokenReplace: "Saving replaces the file.",

            runBtn: "▶ Run",
            runBtnTitle: "Run {name}",
            runStill: "Still running: {name}",
            running: "▶ {name} running …",
            runOk: "✓ {name} done ({ms} ms)",
            runErr: "✗ {name}: {msg}",
            errLine: "{msg} (line {line})",
            errLineFile: "{msg} (line {line} in {file})",
            notFound: "File not found: {p}",
            onlyInAi: "Only possible inside Illustrator.",

            moveRunning: "✗ {name} is running and cannot be moved.",
            notMoved: "✗ Not moved: {msg}",
            noDoc: "No document open.",
            unsaved: "“{name}” has not been saved yet.",
            alreadyThere: "{name} is already in the project folder.",
            movedTo: "✓ {name} moved to {dir}",
            movedAs: "✓ {name} moved to {dir} as {newName}",
            moveFailed: "✗ Move failed: {msg}",

            launchFailed: "Could not start {cmd} ({err})",
            copied: "Path copied.",
            copyFailed: "Could not copy.",

            noMatch: "No match for “{q}”.",
            noScripts: "No .jsx files found.",
            noFolder: "No folder selected yet.",
            chooseFolderBtn: "Choose folder …",
            count: "{n} script(s)",
            truncated: " (list truncated)",
            watched: "watching",
            polling: "polling every {s} s",
            folderUnreadable: "Cannot read folder: {p} ({code})",
            newOne: "＋ New script: {name}",
            newMany: "＋ {n} new scripts: {names}",

            justNow: "just now",
            minAgo: "{n} min ago",
            today: "today {t}"
        }
    };

    let lang = "de";

    function setLanguage(l) {
        lang = dict[l] ? l : "en";
    }

    function t(key, vars) {
        let s = (dict[lang] && dict[lang][key]) || dict.de[key] || key;
        if (vars) {
            s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
        }
        return s;
    }

    // Alle markierten Elemente unterhalb von rootEl übersetzen.
    function translate(rootEl) {
        rootEl.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.getAttribute("data-i18n")); });
        rootEl.querySelectorAll("[data-i18n-title]").forEach((n) => { n.title = t(n.getAttribute("data-i18n-title")); });
        rootEl.querySelectorAll("[data-i18n-placeholder]").forEach((n) => { n.placeholder = t(n.getAttribute("data-i18n-placeholder")); });
    }

    root.ShI18n = {
        t,
        translate,
        setLanguage,
        get language() { return lang; }
    };
})(typeof window !== "undefined" ? window : global);
