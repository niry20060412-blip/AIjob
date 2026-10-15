// 本地端到端验证：复刻 Cloudflare Worker 的逻辑（静态文件 + /.cloud 转发去 Origin）
const http = require("http");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "out");
const PORT = 4173;
const UPSTREAM = "https://ai-job-assistant-33282.app.workbuddy.host";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

function serveStatic(urlPath, res) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let file = path.join(OUT, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (fs.existsSync(path.join(file, "index.html"))) file = path.join(file, "index.html");
    else file = path.join(OUT, "404.html");
  }
  const ext = path.extname(file);
  res.writeHead(fs.existsSync(file) ? 200 : 404, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname.startsWith("/.cloud/")) {
      const upstream = new URL(url.pathname + url.search, UPSTREAM);
      const headers = { ...req.headers };
      delete headers["origin"];
      delete headers["referer"];
      delete headers["cookie"];
      delete headers["host"];
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      try {
        const r = await fetch(upstream, { method: req.method, headers, body });
        res.writeHead(r.status, Object.fromEntries(r.headers));
        const buf = Buffer.from(await r.arrayBuffer());
        res.end(buf);
      } catch (e) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "proxy_failed", message: String(e) }));
      }
      return;
    }
    serveStatic(url.pathname, res);
  })
  .listen(PORT, () => console.log(`test server on http://localhost:${PORT}`));
