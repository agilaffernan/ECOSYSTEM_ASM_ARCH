import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] ?? 4173);
const headers = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
};
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".dot": "text/vnd.graphviz; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mmd": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2"
};

function respond(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, { ...headers, ...extraHeaders });
  response.end(body);
}

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    respond(response, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    respond(response, 400, "Bad Request");
    return;
  }

  let target = path.resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    respond(response, 403, "Forbidden");
    return;
  }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    respond(response, 404, "Not Found");
    return;
  }

  const body = fs.readFileSync(target);
  response.writeHead(200, {
    ...headers,
    "Cache-Control": "no-store",
    "Content-Length": body.length,
    "Content-Type": mimeTypes[path.extname(target).toLowerCase()] ?? "application/octet-stream"
  });
  if (request.method === "HEAD") response.end();
  else response.end(body);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ASM+ Architecture secure preview: http://127.0.0.1:${port}/`);
});
