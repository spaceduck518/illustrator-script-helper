// ---------------------------------------------------------------------------
// Script Helper – Konfiguration.
// Die Datei liegt im Benutzerprofil, weil der Extension-Ordner unter
// "Program Files" für normale Benutzer schreibgeschützt ist:
//   Windows: %APPDATA%\ScriptHelper\config.json
//   macOS:   ~/Library/Application Support/ScriptHelper/config.json
// Sie kann von Hand bearbeitet werden; das Panel bemerkt Änderungen und
// liest sie automatisch neu ein.
// Fehler werden als { key, detail } geliefert; den Text dazu erzeugt i18n.js.
// ---------------------------------------------------------------------------
(function (root) {
    "use strict";

    const fs = require("fs");
    const os = require("os");
    const path = require("path");

    function configDir() {
        if (process.platform === "win32") {
            const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
            return path.join(appData, "ScriptHelper");
        }
        return path.join(os.homedir(), "Library", "Application Support", "ScriptHelper");
    }

    const CONFIG_FILE = path.join(configDir(), "config.json");

    function defaults() {
        return {
            // Leer bis der Nutzer einen Ordner wählt; das Panel fragt beim Erststart danach.
            watchFolder: "",
            includeSubfolders: false,
            // Programm für "Im Editor öffnen", z. B. der Pfad zu Code.exe.
            // Leer = Editor (Windows) bzw. TextEdit (macOS). Bewusst nicht die
            // Dateizuordnung von .jsx: Die zeigt oft auf Illustrator selbst.
            editor: "",
            language: "auto",   // "auto" (wie Illustrator, sonst Englisch), "de", "en"
            theme: "auto"       // "auto" (wie Illustrator), "light", "dark"
        };
    }

    // Unbekannte oder falsch typisierte Werte durch die Standardwerte ersetzen.
    function sanitize(raw) {
        const d = defaults();
        const c = {};
        c.watchFolder = (raw && typeof raw.watchFolder === "string")
            ? raw.watchFolder.trim() : d.watchFolder;
        c.includeSubfolders = (raw && typeof raw.includeSubfolders === "boolean")
            ? raw.includeSubfolders : d.includeSubfolders;
        c.editor = (raw && typeof raw.editor === "string") ? raw.editor.trim() : d.editor;
        c.language = (raw && ["auto", "de", "en"].indexOf(raw.language) >= 0) ? raw.language : d.language;
        c.theme = (raw && ["auto", "light", "dark"].indexOf(raw.theme) >= 0) ? raw.theme : d.theme;
        return c;
    }

    // Liefert { config, error }. Fehlt die Datei, wird sie mit Standardwerten
    // angelegt. Ist sie kaputt, bleibt sie unangetastet (der Nutzer soll seine
    // Änderungen nicht verlieren) und das Panel arbeitet mit Standardwerten.
    function load() {
        try {
            const text = fs.readFileSync(CONFIG_FILE, "utf8").replace(/^﻿/, "");
            const raw = JSON.parse(text);
            const c = sanitize(raw);
            // Neue Einstellungen aus späteren Versionen in die Datei eintragen,
            // damit der Nutzer sie beim Bearbeiten sieht.
            const missing = Object.keys(c).some((k) => !raw || typeof raw !== "object" || !(k in raw));
            return { config: c, error: missing ? save(c) : null };
        } catch (e) {
            if (e.code === "ENOENT") {
                const c = defaults();
                const err = save(c);
                return { config: c, error: err };
            }
            return { config: defaults(), error: { key: "cfgBroken", detail: e.message } };
        }
    }

    // Gibt null zurück oder einen Fehler { key, detail }.
    function save(config) {
        try {
            fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(sanitize(config), null, 2) + "\n", "utf8");
            return null;
        } catch (e) {
            return { key: "cfgSaveFailed", detail: e.message };
        }
    }

    root.ShConfig = { CONFIG_FILE, defaults, load, save };
})(typeof window !== "undefined" ? window : global);
