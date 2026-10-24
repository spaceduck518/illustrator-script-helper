// ---------------------------------------------------------------------------
// Script Helper – Panel-Logik.
// ---------------------------------------------------------------------------
"use strict";

const csInterface = (typeof CSInterface !== "undefined") ? new CSInterface() : null;
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const t = ShI18n.t;

// fs.watch meldet Änderungen sofort, verpasst aber manche Fälle (Netzlaufwerke,
// gelöschter und neu angelegter Ordner). Darum zusätzlich regelmäßig nachsehen.
const POLL_MS = 10000;
const DEBOUNCE_MS = 300;
const CONFIG_POLL_MS = 1000;     // Prüfintervall für Änderungen an config.json

const el = {
    folder: document.getElementById("folder"),
    list: document.getElementById("list"),
    result: document.getElementById("result"),
    status: document.getElementById("status"),
    filter: document.getElementById("filter"),
    menu: document.getElementById("menu"),
    btnConfig: document.getElementById("btnConfig"),
    settingsModal: document.getElementById("settingsModal"),
    settings: document.getElementById("settings"),
    setClose: document.getElementById("setClose"),
    setFolder: document.getElementById("setFolder"),
    setFolderBrowse: document.getElementById("setFolderBrowse"),
    setSub: document.getElementById("setSub"),
    setEditor: document.getElementById("setEditor"),
    setEditorBrowse: document.getElementById("setEditorBrowse"),
    setEditorHint: document.getElementById("setEditorHint"),
    setLanguage: document.getElementById("setLanguage"),
    setTheme: document.getElementById("setTheme"),
    setMsg: document.getElementById("setMsg"),
    setCancel: document.getElementById("setCancel"),
    setOpenFile: document.getElementById("setOpenFile")
};

let config = ShConfig.defaults();
let configError = null;          // { key, detail } aus config.js oder null
let hostInfo = "";
const panelStart = Date.now();   // Dateien, die danach auftauchen, gelten als "neu"

let watcher = null;
let pollTimer = null;
let debounceTimer = null;
let scanning = false;
let scanAgain = false;
let running = null;              // Pfad des gerade laufenden Skripts
let files = [];                  // Ergebnis des letzten Scans (ungefiltert)
let menuFile = null;             // Skript, zu dem das Kontextmenü gehört
let known = null;                // Pfade des letzten Scans, für "neues Skript"-Hinweis
let knownKey = "";               // Ordner + Unterordner-Option, zu denen "known" gehört

// --- Hilfsfunktionen -------------------------------------------------------

function evalScript(script, callback) {
    if (csInterface) csInterface.evalScript(script, callback);
    else if (callback) callback("NO_CEP");
}

function setStatus(text, isError) {
    el.status.textContent = text;
    el.status.title = text;
    el.status.classList.toggle("error", !!isError);
}

// Ergebnis des letzten Skriptlaufs oder Hinweis; bleibt bis zur nächsten Meldung.
function setResult(text, kind) {
    el.result.textContent = text;
    el.result.className = kind || "";
    el.result.hidden = !text;
}

function configErrorText(err) {
    return err ? t(err.key, { detail: err.detail }) : "";
}

function formatTime(ms) {
    const diff = (Date.now() - ms) / 1000;
    if (diff < 60) return t("justNow");
    if (diff < 3600) return t("minAgo", { n: Math.floor(diff / 60) });
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, "0");
    const time = pad(d.getHours()) + ":" + pad(d.getMinutes());
    if (new Date().toDateString() === d.toDateString()) return t("today", { t: time });
    if (ShI18n.language === "de") {
        return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() + " " + time;
    }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + time;
}

// "ERR|CODE|a|b|rest mit |" -> ["ERR", "CODE", "a", "b", "rest mit |"]
function splitResult(res, parts) {
    const all = String(res).split("|");
    return all.slice(0, parts - 1).concat(all.slice(parts - 1).join("|"));
}

// --- Sprache und Design ----------------------------------------------------

function hostLocale() {
    try { return csInterface.getHostEnvironment().appUILocale || ""; }
    catch (e) { return ""; }
}

// "auto": Deutsch bei deutschem Illustrator (de_DE, de_AT, de_CH …), bei allen
// anderen Sprachen und wenn die Sprache unbekannt ist Englisch.
function applyLanguage() {
    const lang = config.language === "auto"
        ? (/^de/i.test(hostLocale()) ? "de" : "en")
        : config.language;
    ShI18n.setLanguage(lang);
    document.documentElement.lang = ShI18n.language;
    ShI18n.translate(document);
}

// "auto": Hintergrundfarbe von Illustrator übernehmen, sonst feste Farben.
function applyTheme() {
    const rootEl = document.documentElement;
    rootEl.style.removeProperty("--bg");
    if (config.theme === "light" || config.theme === "dark") {
        rootEl.classList.toggle("light", config.theme === "light");
        return;
    }
    if (!csInterface) return;
    try {
        const c = csInterface.getHostEnvironment().appSkinInfo.panelBackgroundColor.color;
        const bg = "rgb(" + Math.round(c.red) + "," + Math.round(c.green) + "," + Math.round(c.blue) + ")";
        rootEl.style.setProperty("--bg", bg);
        rootEl.classList.toggle("light", (c.red + c.green + c.blue) / 3 > 128);
    } catch (e) { /* Standardfarben behalten */ }
}

// --- Skript ausführen ------------------------------------------------------

function runScript(file) {
    if (running) {
        setStatus(t("runStill", { name: path.basename(running) }));
        return;
    }
    running = file.path;
    setResult(t("running", { name: file.name }), "busy");
    refresh();

    // JSON.stringify liefert ein gültiges ExtendScript-Stringliteral (Backslashes, Anführungszeichen).
    evalScript("scriptHelper_run(" + JSON.stringify(file.path) + ")", (res) => {
        running = null;
        if (typeof res === "string" && res.indexOf("OK|") === 0) {
            setResult(t("runOk", { name: file.name, ms: res.substring(3) }), "ok");
        } else if (typeof res === "string" && res.indexOf("ERR|SCRIPT|") === 0) {
            const [, , line, errFile, msg] = splitResult(res, 5);
            const text = !line ? msg
                : errFile ? t("errLineFile", { msg: msg, line: line, file: errFile })
                : t("errLine", { msg: msg, line: line });
            setResult(t("runErr", { name: file.name, msg: text }), "error");
        } else if (typeof res === "string" && res.indexOf("ERR|NOTFOUND|") === 0) {
            setResult(t("runErr", { name: file.name, msg: t("notFound", { p: splitResult(res, 3)[2] }) }), "error");
        } else if (res === "NO_CEP") {
            setResult(t("onlyInAi"), "error");
        } else {
            // "EvalScript error." kommt z. B., wenn hostscript.jsx nicht geladen wurde.
            setResult(t("runErr", { name: file.name, msg: res }), "error");
        }
        refresh();
    });
}

// --- In Projektordner verschieben ------------------------------------------

// Freier Dateiname im Zielordner: "name.jsx", sonst "name (2).jsx" usw.
// Eine vorhandene Datei wird nie überschrieben.
function freeTarget(dir, name) {
    const ext = path.extname(name);
    const base = path.basename(name, ext);
    let target = path.join(dir, name);
    for (let n = 2; fs.existsSync(target); n++) {
        target = path.join(dir, base + " (" + n + ")" + ext);
    }
    return target;
}

function moveFile(src, dest) {
    try {
        fs.renameSync(src, dest);
    } catch (e) {
        // Anderes Laufwerk: rename geht nicht, also kopieren und Original löschen.
        if (e.code !== "EXDEV") throw e;
        fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL);
        fs.unlinkSync(src);
    }
}

function moveToProjectFolder(file) {
    if (file.path === running) {
        setResult(t("moveRunning", { name: file.name }), "error");
        return;
    }
    evalScript("scriptHelper_docFolder()", (res) => {
        if (typeof res !== "string" || res.indexOf("OK|") !== 0) {
            let msg;
            if (res === "ERR|NODOC") msg = t("noDoc");
            else if (typeof res === "string" && res.indexOf("ERR|UNSAVED|") === 0) msg = t("unsaved", { name: splitResult(res, 3)[2] });
            else if (res === "NO_CEP") msg = t("onlyInAi");
            else msg = String(res);
            setResult(t("notMoved", { msg: msg }), "error");
            return;
        }
        const dir = res.substring(3);
        if (path.resolve(path.dirname(file.path)).toLowerCase() === path.resolve(dir).toLowerCase()) {
            setResult(t("alreadyThere", { name: file.name }), "");
            return;
        }
        try {
            const target = freeTarget(dir, file.name);
            moveFile(file.path, target);
            const newName = path.basename(target);
            setResult(newName !== file.name
                ? t("movedAs", { name: file.name, newName: newName, dir: dir })
                : t("movedTo", { name: file.name, dir: dir }), "ok");
        } catch (e) {
            setResult(t("moveFailed", { msg: e.message }), "error");
        }
        refresh();
    });
}

// --- Externe Programme -----------------------------------------------------

function launch(cmd, args) {
    try {
        const child = childProcess.spawn(cmd, args, { detached: true, stdio: "ignore" });
        child.on("error", (e) => setStatus(t("launchFailed", { cmd: cmd, err: e.code }), true));
        child.unref();
    } catch (e) {
        setStatus(t("launchFailed", { cmd: cmd, err: e.message }), true);
    }
}

function openInEditor(file) {
    if (config.editor && /\.app\/?$/i.test(config.editor)) launch("open", ["-a", config.editor, file]);
    else if (config.editor) launch(config.editor, [file]);
    else if (process.platform === "win32") launch("notepad.exe", [file]);
    else launch("open", ["-t", file]);
}

function revealInFolder(file) {
    if (process.platform === "win32") launch("explorer.exe", ["/select,", file]);
    else launch("open", ["-R", file]);
}

function copyText(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    setStatus(ok ? t("copied") : t("copyFailed"), !ok);
}

// --- Kontextmenü -----------------------------------------------------------

function showMenu(x, y, file, li) {
    closeMenu();
    menuFile = file;
    li.classList.add("menu-target");
    el.menu.hidden = false;
    // Im Panel halten, auch bei Rechtsklick nahe am Rand.
    const w = el.menu.offsetWidth, h = el.menu.offsetHeight;
    el.menu.style.left = Math.max(0, Math.min(x, window.innerWidth - w - 2)) + "px";
    el.menu.style.top = Math.max(0, Math.min(y, window.innerHeight - h - 2)) + "px";
}

function closeMenu() {
    if (!menuFile) return;
    menuFile = null;
    el.menu.hidden = true;
    renderList();
}

el.menu.addEventListener("click", (e) => {
    const action = e.target.getAttribute("data-action");
    const f = menuFile;
    closeMenu();
    if (!f || !action) return;
    if (action === "run") runScript(f);
    else if (action === "edit") openInEditor(f.path);
    else if (action === "reveal") revealInFolder(f.path);
    else if (action === "move") moveToProjectFolder(f);
    else if (action === "copy") copyText(f.path);
});

document.addEventListener("mousedown", (e) => {
    if (menuFile && !el.menu.contains(e.target)) closeMenu();
});
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (menuFile) closeMenu();
    else closeSettings();
});
window.addEventListener("blur", closeMenu);

// --- Datei-Dialoge ---------------------------------------------------------

// Liefert den gewählten Pfad oder null (abgebrochen / kein CEP).
function browse(chooseDirectory, title, initialPath, fileTypes) {
    if (!window.cep || !window.cep.fs) return null;
    const r = window.cep.fs.showOpenDialogEx
        ? window.cep.fs.showOpenDialogEx(false, chooseDirectory, title, initialPath, fileTypes)
        : window.cep.fs.showOpenDialog(false, chooseDirectory, title, initialPath, fileTypes);
    return (r && !r.err && r.data && r.data.length) ? r.data[0] : null;
}

// --- Einstellungen (Pop-up) ------------------------------------------------

function settingsOpen() {
    return el.settingsModal.classList.contains("show");
}

function openSettings() {
    closeMenu();
    el.setFolder.value = config.watchFolder;
    el.setSub.checked = config.includeSubfolders;
    el.setEditor.value = config.editor;
    el.setLanguage.value = config.language;
    el.setTheme.value = config.theme;
    el.setEditorHint.textContent = t(process.platform === "win32" ? "hintEditorWin" : "hintEditorMac");
    el.setMsg.textContent = configError ? configErrorText(configError) + " " + t("cfgBrokenReplace") : "";
    el.settingsModal.classList.add("show");
}

function closeSettings() {
    el.settingsModal.classList.remove("show");
}

// Gibt eine Fehlermeldung zurück oder null.
function validateSettings(folder, editor) {
    if (!folder) return t("errNoFolder");
    try {
        if (!fs.statSync(folder).isDirectory()) return t("errNotDir", { p: folder });
    } catch (e) {
        return t("errFolderMissing", { p: folder });
    }
    if (editor) {
        try { fs.statSync(editor); } catch (e) { return t("errEditorMissing", { p: editor }); }
    }
    return null;
}

el.settings.addEventListener("submit", (e) => {
    e.preventDefault();
    const folder = el.setFolder.value.trim();
    const editor = el.setEditor.value.trim();
    const err = validateSettings(folder, editor);
    if (err) { el.setMsg.textContent = err; return; }

    const next = {
        watchFolder: folder,
        includeSubfolders: el.setSub.checked,
        editor: editor,
        language: el.setLanguage.value,
        theme: el.setTheme.value
    };
    const saveErr = ShConfig.save(next);
    if (saveErr) { el.setMsg.textContent = configErrorText(saveErr); return; }

    closeSettings();
    applyConfig(ShConfig.load());
});

el.setCancel.addEventListener("click", closeSettings);
el.setClose.addEventListener("click", closeSettings);
// Klick auf den abgedunkelten Hintergrund schließt wie Abbrechen.
el.settingsModal.addEventListener("click", (e) => {
    if (e.target === el.settingsModal) closeSettings();
});

el.setFolderBrowse.addEventListener("click", () => {
    const folder = browse(true, t("dlgFolder"),
                          el.setFolder.value.trim() || config.watchFolder || require("os").homedir());
    if (folder) el.setFolder.value = folder;
});

el.setEditorBrowse.addEventListener("click", () => {
    const current = el.setEditor.value.trim();
    const isWin = process.platform === "win32";
    const file = browse(false, t("dlgEditor"),
                        current ? path.dirname(current) : (isWin ? process.env.ProgramFiles || "C:\\" : "/Applications"),
                        isWin ? ["exe"] : ["app"]);
    if (file) el.setEditor.value = file;
});

el.setOpenFile.addEventListener("click", (e) => {
    e.preventDefault();
    if (!configError) configError = ShConfig.save(config);
    openInEditor(ShConfig.CONFIG_FILE);
});

// --- Liste -----------------------------------------------------------------

function renderList() {
    const scrollTop = el.list.scrollTop;
    const query = el.filter.value.trim().toLowerCase();
    const shown = query
        ? files.filter((f) => (f.rel + "\\" + f.name).toLowerCase().includes(query))
        : files;

    el.list.innerHTML = "";
    if (!config.watchFolder) {
        // Erststart: Es gibt noch keinen Ordner, also gleich zur Auswahl führen.
        const li = document.createElement("li");
        li.className = "empty";
        const msg = document.createElement("div");
        msg.textContent = t("noFolder");
        const btn = document.createElement("button");
        btn.className = "primary setup";
        btn.textContent = t("chooseFolderBtn");
        btn.addEventListener("click", openSettings);
        li.appendChild(msg);
        li.appendChild(btn);
        el.list.appendChild(li);
        return;
    }
    if (!shown.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = files.length ? t("noMatch", { q: el.filter.value.trim() }) : t("noScripts");
        el.list.appendChild(li);
        return;
    }
    for (const f of shown) {
        const li = document.createElement("li");
        li.title = f.path;
        if (f.time > panelStart) li.classList.add("fresh");
        if (f.path === running) li.classList.add("running");

        const name = document.createElement("div");
        name.className = "name";
        name.textContent = f.name;

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = formatTime(f.time) + (f.rel ? "  ·  " + f.rel : "");

        const text = document.createElement("div");
        text.className = "text";
        text.appendChild(name);
        text.appendChild(meta);

        // Ausgeführt wird nur über den Button (oder das Kontextmenü), damit ein
        // versehentlicher Klick in die Liste kein Skript startet.
        const btn = document.createElement("button");
        btn.className = "run";
        btn.textContent = t("runBtn");
        btn.title = t("runBtnTitle", { name: f.name });
        btn.disabled = !!running;
        btn.addEventListener("click", () => runScript(f));

        li.appendChild(text);
        li.appendChild(btn);
        li.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            showMenu(e.clientX, e.clientY, f, li);
        });
        el.list.appendChild(li);
    }
    el.list.scrollTop = scrollTop;
}

// Hinweis in der Ergebniszeile, wenn seit dem letzten Scan Skripte dazugekommen
// sind. Nicht beim ersten Scan eines Ordners und nicht, während ein Skript
// läuft (die Ergebniszeile zeigt dann den Lauf).
function announceNew() {
    const key = config.watchFolder + "|" + config.includeSubfolders;
    if (known && knownKey === key && !running) {
        const added = files.filter((f) => !known.has(f.path));
        if (added.length === 1) {
            setResult(t("newOne", { name: added[0].name }), "info");
        } else if (added.length > 1) {
            const names = added.slice(0, 3).map((f) => f.name).join(", ") + (added.length > 3 ? ", …" : "");
            setResult(t("newMany", { n: added.length, names: names }), "info");
        }
    }
    known = new Set(files.map((f) => f.path));
    knownKey = key;
}

// Nie zwei Scans gleichzeitig; Anfragen während eines Scans lösen danach genau
// einen weiteren Scan aus.
async function refresh() {
    if (scanning) { scanAgain = true; return; }
    scanning = true;

    el.folder.textContent = config.watchFolder || "—";
    el.folder.title = config.watchFolder;

    if (!config.watchFolder) {
        files = [];
        if (!menuFile) renderList();
        setStatus(configError ? configErrorText(configError) : t("noFolder"), !!configError);
        scanning = false;
        return;
    }

    try {
        const result = await ShScanner.scan(config.watchFolder, config.includeSubfolders);
        files = result.files;
        announceNew();
        // Während das Kontextmenü offen ist, nicht neu zeichnen: Die Markierung
        // der Zeile ginge verloren. closeMenu() zeichnet nach.
        if (!menuFile) renderList();
        if (configError) {
            setStatus(configErrorText(configError), true);
        } else {
            let text = t("count", { n: result.files.length });
            if (result.truncated) text += t("truncated");
            text += "  ·  " + (watcher ? t("watched") : t("polling", { s: POLL_MS / 1000 }));
            if (hostInfo) text += "  ·  " + hostInfo;
            setStatus(text, false);
        }
    } catch (e) {
        files = [];
        renderList();
        setStatus(t("folderUnreadable", { p: config.watchFolder, code: e.code }), true);
    }

    scanning = false;
    if (scanAgain) { scanAgain = false; refresh(); }
}

// --- Ordner überwachen -----------------------------------------------------

function scheduleRefresh() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refresh, DEBOUNCE_MS);
}

function closeWatcher() {
    if (watcher) {
        try { watcher.close(); } catch (e) { /* schon zu */ }
        watcher = null;
    }
}

function openWatcher() {
    closeWatcher();
    if (!config.watchFolder) return;
    try {
        // recursive wird unter Windows und macOS unterstützt.
        watcher = fs.watch(config.watchFolder, { recursive: config.includeSubfolders }, scheduleRefresh);
        // Z. B. Ordner gelöscht: Der Poll-Timer versucht es später erneut.
        watcher.on("error", () => { closeWatcher(); scheduleRefresh(); });
    } catch (e) {
        watcher = null;
    }
}

function startWatching() {
    openWatcher();
    clearInterval(pollTimer);
    pollTimer = setInterval(() => {
        if (!watcher) openWatcher();
        refresh();
    }, POLL_MS);
    refresh();
}

// --- Konfiguration ---------------------------------------------------------

function applyConfig(r) {
    const old = config;
    config = r.config;
    configError = r.error;
    applyLanguage();
    applyTheme();
    if (old.watchFolder !== config.watchFolder || old.includeSubfolders !== config.includeSubfolders || !watcher) {
        startWatching();
    } else {
        refresh();      // Texte in der neuen Sprache neu zeichnen
    }
}

// config.json beobachten, damit Änderungen von Hand ohne Neuladen wirken.
// fs.watchFile fragt regelmäßig ab und übersteht auch Editoren, die die Datei
// beim Speichern ersetzen statt sie zu überschreiben.
fs.watchFile(ShConfig.CONFIG_FILE, { interval: CONFIG_POLL_MS }, (cur, prev) => {
    if (cur.mtimeMs !== prev.mtimeMs) applyConfig(ShConfig.load());
});

// --- Bedienelemente --------------------------------------------------------

el.btnConfig.addEventListener("click", () => {
    if (settingsOpen()) closeSettings();
    else openSettings();
});

el.filter.addEventListener("input", () => renderList());

window.addEventListener("unload", () => {
    closeWatcher();
    clearInterval(pollTimer);
    fs.unwatchFile(ShConfig.CONFIG_FILE);
});

// --- Start -----------------------------------------------------------------

if (csInterface) {
    csInterface.addEventListener("com.adobe.csxs.events.ThemeColorChanged", applyTheme);
}

evalScript("scriptHelper_ping()", (res) => {
    if (typeof res === "string" && res.indexOf("OK|") === 0) {
        hostInfo = "Illustrator " + res.substring(3);
        refresh();
    }
});

setResult("");
config = ShConfig.defaults();
applyConfig(ShConfig.load());
if (!config.watchFolder) openSettings();
