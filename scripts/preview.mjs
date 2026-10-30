// Local-only preview: runs the real game API against an isolated memory store.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { handler } from "../server/api.js";
const rooms = new Map(),
  root = resolve("public");
const store = {
  async list() {
    return [...rooms]
      .map(([code, r]) => ({ code, ...structuredClone(r) }))
      .filter((r) => Date.parse(r.expires_at) > Date.now());
  },
  async read(code) {
    const r = rooms.get(code);
    return r && Date.parse(r.expires_at) > Date.now()
      ? structuredClone(r)
      : null;
  },
  async create(code, state) {
    if (rooms.has(code)) return null;
    const row = {
      state,
      revision: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 18000000).toISOString(),
    };
    rooms.set(code, row);
    return structuredClone(row);
  },
  async update(code, revision, state) {
    const r = rooms.get(code);
    if (!r || r.revision !== revision) return false;
    rooms.set(code, { ...r, state, revision: revision + 1 });
    return true;
  },
  async remove(code, revision) {
    if (rooms.get(code)?.revision !== revision) return false;
    return rooms.delete(code);
  },
};
const api = handler(store);
http
  .createServer(async (req, res) => {
    try {
      if (req.url === "/api") {
        let body = "";
        for await (const chunk of req) body += chunk;
        const reply = await api(
          new Request("http://localhost/api", {
            method: req.method,
            body: req.method === "POST" ? body : undefined,
            headers: req.headers,
          }),
        );
        res.writeHead(reply.status, Object.fromEntries(reply.headers));
        res.end(await reply.text());
        return;
      }
      const pathname = new URL(req.url, "http://localhost").pathname;
      if (pathname === "/online-config.js") {
        res.setHeader("Content-Type", "text/javascript");
        res.end("export const endpoint='/api';");
        return;
      }
      const path = resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!path.startsWith(root + "/")) {
        res.writeHead(403).end();
        return;
      }
      const data = await readFile(path);
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".mjs": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".png": "image/png",
        }[extname(path)] || "application/octet-stream",
      );
      res.end(data);
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("Local preview http://127.0.0.1:4173"),
  );
