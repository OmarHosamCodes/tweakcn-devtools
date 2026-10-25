import type { CommunityPage } from "./types";

export const DEFAULT_COMMUNITY_PATH = "/__tweakcn/community";

/** Dev-server route that returns the host app's package.json name. */
export const TWEAKCN_APP_PATH = "/__tweakcn/app";

export async function fetchCommunityPage(
  communityUrl: string,
  cursor?: string | number | null,
): Promise<CommunityPage> {
  const res = await fetch(communityUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ cursor: cursor ?? null }),
  });
  if (!res.ok) {
    throw new Error(`Community fetch failed (${res.status})`);
  }
  return (await res.json()) as CommunityPage;
}
