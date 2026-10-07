import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { TWEAKCN_COMMUNITY_ACTION_ID, TWEAKCN_COMMUNITY_ORIGIN, parseTweakcnFlight } from "../src/flight";

const dataDir = join(import.meta.dir, "../src/data");

const registryRes = await fetch("https://tweakcn.com/r/registry.json");
if (!registryRes.ok) throw new Error(`Failed to fetch registry: ${registryRes.status}`);
await writeFile(join(dataDir, "predefined-registry.json"), JSON.stringify(await registryRes.json(), null, 2));

async function fetchCommunityPage(cursor?: string | number) {
  const body = cursor == null ? JSON.stringify(["popular"]) : JSON.stringify(["popular", cursor]);
  const res = await fetch(TWEAKCN_COMMUNITY_ORIGIN, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      "Next-Action": TWEAKCN_COMMUNITY_ACTION_ID,
    },
    body,
  });
  if (!res.ok) throw new Error(`Community sync failed: ${res.status}`);
  return parseTweakcnFlight(await res.text());
}

const themes: unknown[] = [];
let cursor: string | number | undefined;
for (let page = 0; page < 25; page++) {
  const data = await fetchCommunityPage(cursor);
  themes.push(...data.themes);
  if (data.nextCursor == null) break;
  cursor = data.nextCursor;
}

await writeFile(
  join(dataDir, "community-snapshot.json"),
  JSON.stringify({ updatedAt: new Date().toISOString(), themes }, null, 2),
);

console.log(`Synced ${themes.length} community themes and the predefined registry.`);
