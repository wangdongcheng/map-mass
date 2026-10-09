import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const ids = process.argv.slice(2);
if (!ids.length) throw new Error("Pass church IDs, e.g. node scripts/render-model-previews.mjs 0202");
if (typeof WebSocket === "undefined") throw new Error("Preview rendering requires Node.js 22 or newer");
const candidates = [process.env.MODEL_PREVIEW_BROWSER,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/chromium", "/usr/bin/google-chrome"].filter(Boolean);
let browserPath;
for (const candidate of candidates) { try { await access(candidate); browserPath = candidate; break; } catch {} }
if (!browserPath) throw new Error("Set MODEL_PREVIEW_BROWSER to a Chromium browser executable");
const server = await createServer({ server: { host: "127.0.0.1", port: 0 }, plugins: [{
  name: "isolated-model-preview",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split("?")[0] !== "/__model-preview") return next();
      res.setHeader("Content-Type", "text/html");
      res.end('<!doctype html><html><head><title>Church model preview</title></head><body><script type="module" src="/scripts/model-preview-scene.js"></script></body></html>');
    });
  }
}] });
await server.listen();
const origin = server.resolvedUrls.local[0].replace(/\/$/, "");
const profile = path.resolve("node_modules/.cache/model-preview-browser");
await mkdir(profile, { recursive: true });
const browser = spawn(browserPath, ["--headless=new", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--enable-unsafe-swiftshader", "about:blank"],
  { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Browser startup timed out")), 30000);
    let stderr = "";
    browser.stderr.on("data", (data) => {
      stderr += data;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    browser.once("error", (error) => { clearTimeout(timer); reject(error); });
    browser.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Browser exited: ${code}\n${stderr}`)); });
  });
  const debugOrigin = endpoint.replace(/^ws:/, "http:").split("/devtools/")[0];
  const targets = await (await fetch(`${debugOrigin}/json/list`)).json();
  const target = targets.find((t) => t.type === "page");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!pending.has(message.id)) return;
    const { resolve, reject, timer } = pending.get(message.id);
    pending.delete(message.id); clearTimeout(timer);
    if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  await send("Page.enable");
  await send("Runtime.enable");
  for (const id of ids) {
    await mkdir(`references/map/${id}`, { recursive: true });
    await send("Page.navigate", { url: `${origin}/__model-preview?id=${encodeURIComponent(id)}` });
    let preview;
    for (let attempt = 0; attempt < 120; attempt++) {
      const response = await send("Runtime.evaluate", { expression: "window.modelPreview", returnByValue: true });
      preview = response.result?.value;
      if (preview?.id === id || preview?.error) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (preview?.error) throw new Error(preview.error);
    if (!preview?.png || preview.id !== id) throw new Error(`Rendering timed out for ${id}`);
    const png = Buffer.from(preview.png.split(",")[1], "base64");
    await writeFile(`references/map/${id}/${id}-model-preview.png`, png);
    console.log(`${id}: ${preview.width} × ${preview.height}, ${png.length} bytes`);
  }
} finally {
  socket?.close(); browser.kill(); await server.close();
}
