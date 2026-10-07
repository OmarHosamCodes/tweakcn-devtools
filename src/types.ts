export type ThemeMode = "light" | "dark";

export type ThemeStyleProps = Record<string, string>;

export interface ThemeStyles {
  light: ThemeStyleProps;
  dark: ThemeStyleProps;
}

export interface ThemeCatalogEntry {
  id: string;
  name: string;
  source: "preset" | "community";
  styles: ThemeStyles;
  tags?: string[];
  author?: string;
  likeCount?: number;
}

export interface CommunityPage {
  themes: ThemeCatalogEntry[];
  nextCursor: string | number | null;
}

export interface TweakcnDevtoolsOptions {
  initialIsOpen?: boolean;
  defaultMode?: ThemeMode;
  /** POST endpoint that returns `{ themes, nextCursor }` JSON. Defaults to the Vite plugin path. */
  communityUrl?: string;
  disableCommunity?: boolean;
  zIndex?: number;
}
