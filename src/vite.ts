import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { DEFAULT_COMMUNITY_PATH, TWEAKCN_APP_PATH } from "./community";
import { injectEditorBoot, patchEditorBundle } from "./editor-patch";
import { TWEAKCN_COMMUNITY_ACTION_ID, TWEAKCN_COMMUNITY_ORIGIN, parseTweakcnFlight } from "./flight";
import { mapCommunityRow } from "./map-theme";

const TWEAKCN_ORIGIN = "https://tweakcn.com";

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function refererIsEditor(referer: string | undefined): boolean {
  if (!referer) return false;
  try {
    const path = new URL(referer).pathname;
    return path === "/editor" || path.startsWith("/editor/");
  } catch {
    return false;
  }
}

export function shouldProxyEditor(url: string, referer: string | undefined): boolean {
  const parsed = new URL(url, "http://localhost");
  const path = parsed.pathname;
  if (path === "/_next" || path.startsWith("/_next/")) return true;
  if (path === "/editor" || path.startsWith("/editor/")) return true;
  if (path.startsWith("/api/auth")) return true;
  return refererIsEditor(referer) && (path.startsWith("/api/") || parsed.searchParams.has("_rsc"));
}

function rewriteSetCookie(cookie: string): string {
  return cookie
    .split(";")
    .filter((part) => !/^\s*domain=/i.test(part))
    .join(";");
}

async function proxyEditor(req: IncomingMessage, res: ServerResponse) {
  const target = new URL(req.url ?? "/", TWEAKCN_ORIGIN);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection" || lower === "content-length" || lower === "accept-encoding") {
      continue;
    }
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  const method = req.method ?? "GET";
  const body = method === "GET" || method === "HEAD" ? undefined : new Uint8Array(await readBody(req));
  const upstream = await fetch(target, { method, headers, body, redirect: "follow" });
  res.statusCode = upstream.status;
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === "content-encoding" ||
      lower === "content-length" ||
      lower === "transfer-encoding" ||
      lower === "connection" ||
      lower === "content-security-policy" ||
      lower === "x-frame-options" ||
      lower === "set-cookie" ||
      lower === "cache-control" ||
      lower === "expires"
    ) {
      return;
    }
    res.setHeader(key, value);
  });
  res.setHeader("cache-control", "no-store");
  const cookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  if (cookies.length > 0) {
    res.setHeader(
      "set-cookie",
      cookies.map((cookie) => rewriteSetCookie(cookie)),
    );
  }
  const raw = Buffer.from(await upstream.arrayBuffer());
  const payload = transformProxiedEditor(req.url ?? "/", upstream.headers.get("content-type") ?? "", raw);
  res.setHeader("content-length", payload.length);
  res.end(payload);
}

function transformProxiedEditor(url: string, contentType: string, payload: Buffer): Buffer {
  const path = new URL(url, "http://localhost").pathname;
  const type = contentType.toLowerCase();
  if (type.includes("text/html") && (path === "/editor" || path.startsWith("/editor/"))) {
    return Buffer.from(injectEditorBoot(payload.toString("utf8")));
  }
  if (type.includes("javascript") || path.endsWith(".js")) {
    const source = payload.toString("utf8");
    const patched = patchEditorBundle(source);
    if (patched !== source) return Buffer.from(patched);
  }
  return payload;
}

function readPackageName(root: string): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { name?: unknown };
    if (typeof pkg.name === "string" && pkg.name.trim()) return pkg.name.trim();
  } catch {
    // The dev server still runs when package.json cannot be read.
  }
  return "app";
}

export interface TweakcnDevtoolsViteOptions {
  communityPath?: string;
}

async function readBody(req: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function tweakcnDevtools(options: TweakcnDevtoolsViteOptions = {}): Plugin {
  const communityPath = options.communityPath ?? DEFAULT_COMMUNITY_PATH;

  return {
    name: "tweakcn-devtools",
    configureServer(server) {
      const packageName = readPackageName(server.config.root);
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        const path = new URL(url, "http://localhost").pathname;
        if (path === TWEAKCN_APP_PATH && (req.method === "GET" || req.method === "HEAD")) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ name: packageName }));
          return;
        }
        if (shouldProxyEditor(url, headerValue(req.headers.referer))) {
          try {
            await proxyEditor(req, res);
          } catch (error) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(error instanceof Error ? error.message : "Editor proxy failed");
          }
          return;
        }
        if (!url.startsWith(communityPath)) {
          next();
          return;
        }
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "POST required" }));
          return;
        }

        try {
          const incoming = JSON.parse((await readBody(req)).toString("utf8") || "{}") as {
            cursor?: string | number | null;
          };
          const cursor = incoming.cursor ?? null;
          const body =
            cursor == null ? JSON.stringify(["popular"]) : JSON.stringify(["popular", cursor]);
          const upstream = await fetch(TWEAKCN_COMMUNITY_ORIGIN, {
            method: "POST",
            headers: {
              "Content-Type": "text/plain;charset=UTF-8",
              Accept: "text/x-component",
              "Next-Action": TWEAKCN_COMMUNITY_ACTION_ID,
            },
            body,
          });
          const parsed = parseTweakcnFlight(await upstream.text());
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              themes: parsed.themes.map(mapCommunityRow),
              nextCursor: parsed.nextCursor,
            }),
          );
        } catch (error) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Community proxy failed",
            }),
          );
        }
      });
    },
  };
}

export default tweakcnDevtools;
