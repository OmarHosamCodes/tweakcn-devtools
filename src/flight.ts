import type { CommunityThemeRow } from "./map-theme";

export function parseTweakcnFlight(body: string): {
  themes: CommunityThemeRow[];
  nextCursor: string | number | null;
} {
  const line = body.split("\n").find((entry) => entry.startsWith("1:"));
  if (!line) throw new Error("Invalid tweakcn community response");
  const payload = JSON.parse(line.slice(2)) as {
    themes?: CommunityThemeRow[];
    nextCursor?: string | number | null;
    digest?: string;
  };
  if (payload.digest) throw new Error("tweakcn community action failed");
  return {
    themes: payload.themes ?? [],
    nextCursor: payload.nextCursor ?? null,
  };
}

export const TWEAKCN_COMMUNITY_ACTION_ID = "7ea31f9be67f30e9257bce54353dd1465c459c0905";
export const TWEAKCN_COMMUNITY_ORIGIN = "https://tweakcn.com/community";
