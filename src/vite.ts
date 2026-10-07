import type { Plugin } from "vite";
import { TWEAKCN_COMMUNITY_ACTION_ID, TWEAKCN_COMMUNITY_ORIGIN, parseTweakcnFlight } from "./flight";
import { mapCommunityRow } from "./map-theme";
import { DEFAULT_COMMUNITY_PATH } from "./community";

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
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(communityPath)) {
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
