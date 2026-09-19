import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";

const WEB_ROOT = resolve(dirname(__dirname));
const MAX_THEME_BYTES = 1024 * 1024;
const MAX_SESSION_BYTES = 5 * 1024 * 1024;
const token = randomBytes(24).toString("hex");
let server: ReturnType<typeof createServer> | undefined;
let serverUrl: string | undefined;
let activeContext: ExtensionContext | undefined;

const agentDir = () => process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
const themesDir = () => join(agentDir(), "themes");
function safeThemeFilename(value: unknown) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}\.json$/i.test(value)) throw new Error("Invalid theme filename");
  return value;
}
function themePath(filename: string) {
  const root = resolve(themesDir()), path = resolve(root, safeThemeFilename(filename));
  if (!path.startsWith(root + "\\") && !path.startsWith(root + "/")) throw new Error("Invalid theme path");
  return path;
}
function send(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(value));
}
function sendStatic(response: ServerResponse, status: number, type: string, body: string | Buffer) {
  response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'self'; connect-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'" });
  response.end(body);
}
async function readJson(request: IncomingMessage, maxBytes = MAX_THEME_BYTES) {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of request) { const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += data.length; if (size > maxBytes) throw new Error("Request exceeds the size limit"); chunks.push(data); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new Error("Invalid JSON"); }
}
function validTheme(value: unknown): value is { name?: string; colors: Record<string, unknown> } {
  return !!value && typeof value === "object" && !Array.isArray(value) && !!(value as { colors?: unknown }).colors && typeof (value as { colors: unknown }).colors === "object" && !Array.isArray((value as { colors: unknown }).colors);
}
async function listThemes() {
  try { return (await fs.readdir(themesDir(), { withFileTypes: true })).filter(item => item.isFile() && extname(item.name).toLowerCase() === ".json").map(item => item.name).sort((a, b) => a.localeCompare(b)); }
  catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}
function requireSessionRoot() {
  const dir = activeContext?.sessionManager.getSessionDir();
  if (!dir) throw new Error("Pi has no persistent session directory in this session");
  const resolved = resolve(dir);
  const name = basename(resolved);
  return name.startsWith("--") && name.endsWith("--") ? dirname(resolved) : resolved;
}
function safeSessionId(value: unknown) {
  if (typeof value !== "string" || !value.endsWith(".jsonl") || value.length > 500) throw new Error("Invalid session id");
  const parts = value.split("/");
  if (!parts.length || parts.some(part => !/^[A-Za-z0-9._-]+$/.test(part) || part === "." || part === "..")) throw new Error("Invalid session id");
  return parts;
}
function sessionPath(id: unknown) {
  const root = requireSessionRoot(), path = resolve(root, ...safeSessionId(id));
  if (!path.startsWith(root + sep)) throw new Error("Invalid session path");
  return path;
}
async function sessionSummary(path: string, root: string, current: string | undefined) {
  const stat = await fs.stat(path);
  const base = { id: relative(root, path).split(sep).join("/"), name: basename(path, ".jsonl"), modified: stat.mtimeMs, bytes: stat.size, current: resolve(path) === resolve(current || "") };
  if (stat.size > MAX_SESSION_BYTES) return { ...base, cwd: null, timestamp: null, title: null, tooLarge: true };
  const text = await fs.readFile(path, "utf8");
  const first = text.split(/\r?\n/, 1)[0]; let header: { cwd?: string; timestamp?: string } = {};
  try { header = JSON.parse(first); } catch { /* The viewer will report malformed files when opened. */ }
  return { ...base, cwd: typeof header.cwd === "string" ? header.cwd : null, timestamp: typeof header.timestamp === "string" ? header.timestamp : null, title: extractSessionTitle(text), tooLarge: false };
}
function extractSessionTitle(text: string): string | null {
  // The first user message makes a readable label; bounded to the first 60 records for cheap scanning.
  for (const line of text.split(/\r?\n/).filter(Boolean).slice(0, 60)) {
    let record: unknown; try { record = JSON.parse(line); } catch { continue; }
    if (!record || typeof record !== "object" || Array.isArray(record)) continue;
    const message = (record as { message?: unknown }).message;
    if (!message || typeof message !== "object" || (message as { role?: unknown }).role !== "user") continue;
    const content = (message as { content?: unknown }).content;
    const parts = Array.isArray(content) ? content : [content];
    for (const part of parts) {
      const value = typeof part === "string" ? part : (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string" ? (part as { text: string }).text : "");
      const trimmed = value.replace(/\s+/g, " ").trim();
      if (trimmed) return trimmed.length > 80 ? trimmed.slice(0, 80).trimEnd() + "…" : trimmed;
    }
  }
  return null;
}
async function listSessions() {
  const root = requireSessionRoot(), current = activeContext?.sessionManager.getSessionFile(); const files: string[] = [];
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > 4 || files.length >= 500) return;
    let entries; try { entries = await fs.readdir(directory, { withFileTypes: true }); } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return; throw error; }
    for (const entry of entries) { const path = join(directory, entry.name); if (entry.isDirectory()) await walk(path, depth + 1); else if (entry.isFile() && extname(entry.name).toLowerCase() === ".jsonl") files.push(path); }
  }
  await walk(root, 0); const summaries = (await Promise.all(files.map(path => sessionSummary(path, root, current)))).filter(Boolean);
  return summaries.sort((a, b) => b!.modified - a!.modified);
}
function validateSessionText(text: unknown) {
  if (typeof text !== "string" || Buffer.byteLength(text, "utf8") > MAX_SESSION_BYTES) throw new Error("Session exceeds the 5 MB limit");
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length || lines.length > 2000) throw new Error("Session must contain 1–2000 JSONL records");
  for (const line of lines) { if (line.length > 24000) throw new Error("Session record is too large"); const value = JSON.parse(line); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Every session record must be a JSON object"); }
  return text.endsWith("\n") ? text : text + "\n";
}
async function saveDefaultTheme(filename: string) {
  const settingsPath = join(agentDir(), "settings.json"); let settings: Record<string, unknown> = {};
  try { const parsed = JSON.parse(await fs.readFile(settingsPath, "utf8")); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Pi settings.json must be an object"); settings = parsed; }
  catch (error: unknown) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  settings.theme = basename(filename, ".json"); await fs.mkdir(agentDir(), { recursive: true });
  const temporary = join(agentDir(), `.settings.${randomBytes(6).toString("hex")}.tmp`); await fs.writeFile(temporary, JSON.stringify(settings, null, 2) + "\n", { encoding: "utf8", mode: 0o600 }); await fs.rename(temporary, settingsPath);
}
async function serveStatic(pathname: string, response: ServerResponse) {
  const files: Record<string, [string, string]> = { "/": ["index.html", "text/html; charset=utf-8"], "/index.html": ["index.html", "text/html; charset=utf-8"], "/app.js": ["app.js", "application/javascript; charset=utf-8"], "/style.css": ["style.css", "text/css; charset=utf-8"] };
  const file = files[pathname];
  if (!file) return sendStatic(response, 404, "text/plain; charset=utf-8", "Not found");
  try { sendStatic(response, 200, file[1], await fs.readFile(join(WEB_ROOT, file[0]))); } catch { sendStatic(response, 500, "text/plain; charset=utf-8", "Theme Builder assets are unavailable"); }
}
async function handleApi(request: IncomingMessage, response: ServerResponse, url: URL) {
  if (request.headers["x-theme-builder-token"] !== token) return send(response, 401, { error: "Unauthorized" });
  try {
    if (request.method === "GET" && url.pathname === "/api/config") return send(response, 200, { agentDir: agentDir(), themesDir: themesDir(), sessionDir: activeContext?.sessionManager.getSessionDir() ?? null, sessionRoot: activeContext?.sessionManager.getSessionDir() ? requireSessionRoot() : null, activeSession: activeContext?.sessionManager.getSessionFile() ?? null });
    if (request.method === "GET" && url.pathname === "/api/themes") return send(response, 200, { themes: await listThemes() });
    if (request.method === "GET" && url.pathname === "/api/theme") { const filename = safeThemeFilename(url.searchParams.get("filename")); const text = await fs.readFile(themePath(filename), "utf8"); if (Buffer.byteLength(text) > MAX_THEME_BYTES) throw new Error("Theme exceeds 1 MB"); return send(response, 200, { filename, theme: JSON.parse(text) }); }
    if (request.method === "POST" && url.pathname === "/api/themes") {
      const body = await readJson(request); const theme = (body as { theme?: unknown })?.theme;
      if (!validTheme(theme)) throw new Error("A Pi theme with colors is required");
      const requested = (body as { filename?: unknown }).filename;
      const stem = (typeof requested === "string" ? requested : theme.name || "my-theme").replace(/\.json$/i, "").replace(/[^a-z0-9_-]/gi, "-").replace(/^-+|-+$/g, "").slice(0, 128) || "my-theme";
      const filename = safeThemeFilename(`${stem}.json`); await fs.mkdir(themesDir(), { recursive: true });
      const temporary = join(themesDir(), `.${filename}.${randomBytes(6).toString("hex")}.tmp`); await fs.writeFile(temporary, JSON.stringify(theme, null, 2) + "\n", { encoding: "utf8", mode: 0o600 }); await fs.rename(temporary, themePath(filename)); return send(response, 201, { filename });
    }
    if (request.method === "POST" && url.pathname === "/api/activate") {
      const filename = safeThemeFilename((await readJson(request) as { filename?: unknown }).filename); await fs.access(themePath(filename));
      if (!activeContext) throw new Error("Run /theme-builder from an interactive Pi session first");
      const result = activeContext.ui.setTheme(basename(filename, ".json")); if (!result.success) throw new Error(result.error || "Pi could not activate this theme"); return send(response, 200, { filename });
    }
    if (request.method === "POST" && url.pathname === "/api/default-theme") {
      const filename = safeThemeFilename((await readJson(request) as { filename?: unknown }).filename); await fs.access(themePath(filename)); await saveDefaultTheme(filename); return send(response, 200, { filename });
    }
    if (request.method === "GET" && url.pathname === "/api/sessions") return send(response, 200, { sessions: await listSessions() });
    if (request.method === "GET" && url.pathname === "/api/session") {
      const id = url.searchParams.get("id"), path = sessionPath(id); const text = await fs.readFile(path, "utf8"); if (Buffer.byteLength(text, "utf8") > MAX_SESSION_BYTES) throw new Error("Session exceeds the 5 MB limit"); return send(response, 200, { id, text });
    }
    if (request.method === "POST" && url.pathname === "/api/sessions/import") {
      const body = await readJson(request, MAX_SESSION_BYTES * 2 + 128 * 1024) as { text?: unknown }; const text = validateSessionText(body.text); const root = requireSessionRoot();
      const current = activeContext?.sessionManager.getSessionFile(); const destinationDir = current && resolve(current).startsWith(root + sep) ? dirname(current) : root;
      await fs.mkdir(destinationDir, { recursive: true }); const filename = `imported_${Date.now()}_${randomBytes(5).toString("hex")}.jsonl`; const destination = join(destinationDir, filename);
      await fs.writeFile(destination, text, { encoding: "utf8", mode: 0o600 }); return send(response, 201, { id: relative(root, destination).split(sep).join("/") });
    }
    return send(response, 404, { error: "Not found" });
  } catch (error: unknown) { return send(response, (error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 400, { error: error instanceof Error ? error.message : "Request failed" }); }
}
async function startServer() {
  if (serverUrl) return serverUrl;
  server = createServer(async (request, response) => { const url = new URL(request.url || "/", "http://127.0.0.1"); if (url.pathname.startsWith("/api/")) await handleApi(request, response, url); else await serveStatic(url.pathname, response); });
  await new Promise<void>((done, fail) => { server!.once("error", fail); server!.listen(0, "127.0.0.1", () => { server!.off("error", fail); done(); }); });
  const address = server.address(); if (!address || typeof address === "string") throw new Error("Could not determine Theme Builder port"); serverUrl = `http://127.0.0.1:${address.port}/?token=${token}`; return serverUrl;
}
async function tryOpen(command: string, args: string[]) {
  return new Promise<boolean>(resolveOpen => {
    const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
    child.once("error", () => resolveOpen(false));
    child.once("spawn", () => { child.unref(); resolveOpen(true); });
  });
}
async function isWsl() {
  if (process.env.WSL_INTEROP || process.env.WSL_DISTRO_NAME) return true;
  try { return (await fs.readFile("/proc/version", "utf8")).toLowerCase().includes("microsoft"); }
  catch { return false; }
}
async function openBrowser(url: string) {
  if (process.platform === "win32") return tryOpen("cmd", ["/c", "start", "", url]);
  if (process.platform === "darwin") return tryOpen("open", [url]);
  // In WSL, xdg-open can exist without a graphical desktop and return before
  // opening anything. Prefer the Windows browser there.
  const candidates: [string, string[]][] = await isWsl()
    ? [["cmd.exe", ["/c", "start", "", url]], ["powershell.exe", ["-NoProfile", "-Command", "Start-Process", url]], ["wslview", [url]]]
    : [["xdg-open", [url]], ["gio", ["open", url]]];
  for (const [command, args] of candidates) {
    if (await tryOpen(command, args)) return true;
  }
  return false;
}
export default function (pi: ExtensionAPI) {
  pi.registerCommand("theme-builder", { description: "Open the Pi Theme Builder in your browser", handler: async (_args, ctx) => { if (!ctx.hasUI) throw new Error("/theme-builder requires an interactive Pi session"); activeContext = ctx; const url = await startServer(); if (await openBrowser(url)) ctx.ui.notify("Pi Theme Builder opened in your browser", "success"); else ctx.ui.notify(`Could not launch a browser. Open this local URL manually: ${url}`, "warning"); } });
  pi.on("session_shutdown", async () => { if (server) await new Promise<void>(done => server!.close(() => done())); server = undefined; serverUrl = undefined; activeContext = undefined; });
}
