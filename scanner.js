// ---------------------------------------------------------------------------
// Script Helper – sucht .jsx-Dateien im überwachten Ordner.
// ---------------------------------------------------------------------------
(function (root) {
    "use strict";

    const fs = require("fs");
    const path = require("path");

    const MAX_DEPTH = 8;      // Unterordner-Tiefe bei includeSubfolders
    const MAX_FILES = 2000;   // Schutz vor riesigen Ordnerbäumen
    const SKIP_DIRS = new Set(["node_modules", "$RECYCLE.BIN", "System Volume Information"]);

    function isScript(name) {
        return /\.jsx$/i.test(name);
    }

    // Beim Kopieren im Explorer bleibt mtime alt, birthtime ist aber neu.
    // Der größere Wert ist der Zeitpunkt, an dem die Datei "aufgetaucht" ist.
    function seenTime(st) {
        return Math.max(st.mtimeMs || 0, st.birthtimeMs || 0);
    }

    // Liefert { files: [{ name, path, rel, time }], truncated }
    // sortiert mit der neuesten Datei zuerst.
    async function scan(folder, includeSubfolders) {
        const files = [];
        let truncated = false;

        async function walk(dir, depth) {
            let entries;
            try {
                entries = await fs.promises.readdir(dir, { withFileTypes: true });
            } catch (e) {
                if (depth === 0) throw e;   // Hauptordner fehlt: dem Panel melden
                return;                     // Unterordner ohne Rechte: überspringen
            }
            for (const ent of entries) {
                if (files.length >= MAX_FILES) { truncated = true; return; }
                const full = path.join(dir, ent.name);
                if (ent.isDirectory()) {
                    if (includeSubfolders && depth < MAX_DEPTH &&
                        !ent.name.startsWith(".") && !SKIP_DIRS.has(ent.name)) {
                        await walk(full, depth + 1);
                    }
                } else if (ent.isFile() && isScript(ent.name)) {
                    try {
                        const st = await fs.promises.stat(full);
                        files.push({
                            name: ent.name,
                            path: full,
                            rel: path.relative(folder, dir),
                            time: seenTime(st)
                        });
                    } catch (e) { /* Datei inzwischen gelöscht */ }
                }
            }
        }

        await walk(folder, 0);
        files.sort((a, b) => b.time - a.time);
        return { files, truncated };
    }

    root.ShScanner = { scan, isScript };
})(typeof window !== "undefined" ? window : global);
