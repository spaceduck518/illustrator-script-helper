// ---------------------------------------------------------------------------
// Script Helper – ExtendScript-Seite (läuft in Illustrator).
// Rückgaben sind mit "|" getrennt. Fehler kommen als Code, den Text dazu
// erzeugt das Panel in der eingestellten Sprache (i18n.js).
// ---------------------------------------------------------------------------

// Verbindungstest für das Panel: liefert die Illustrator-Version.
function scriptHelper_ping() {
    return "OK|" + app.version;
}

// Ordner, in dem das aktive Dokument gespeichert ist.
// Rückgabe: "OK|<Ordner>", "ERR|NODOC" oder "ERR|UNSAVED|<Dokumentname>".
function scriptHelper_docFolder() {
    if (app.documents.length === 0) return "ERR|NODOC";
    var doc = app.activeDocument;
    var folder;
    try {
        folder = doc.path;      // bei nie gespeicherten Dokumenten leer
    } catch (e) {
        folder = null;
    }
    if (!folder || String(folder) === "" || !folder.fsName || !folder.exists) {
        return "ERR|UNSAVED|" + doc.name;
    }
    return "OK|" + folder.fsName;
}

// Führt eine .jsx-Datei aus, wie Datei > Skripte > Andere Skripte.
// Rückgabe: "OK|<ms>", "ERR|NOTFOUND|<Pfad>" oder
// "ERR|SCRIPT|<Zeile>|<Datei, falls #include>|<Meldung>" (Meldung zuletzt,
// weil sie selbst "|" enthalten kann).
function scriptHelper_run(path) {
    var f = new File(path);
    if (!f.exists) return "ERR|NOTFOUND|" + path;

    // Relative Pfade im Skript (#include, new File("bild.png")) sollen
    // relativ zum Skriptordner gelten, wie beim Start über das Menü.
    var oldCurrent = Folder.current;
    Folder.current = f.parent;
    var start = new Date().getTime();
    try {
        $.evalFile(f);
        return "OK|" + (new Date().getTime() - start);
    } catch (e) {
        var errFile = "";
        if (e.line && e.fileName) {
            var ef = new File(e.fileName);
            if (ef.fsName !== f.fsName) errFile = ef.name;
        }
        return "ERR|SCRIPT|" + (e.line || "") + "|" + errFile + "|" + (e.message || String(e));
    } finally {
        Folder.current = oldCurrent;
    }
}
