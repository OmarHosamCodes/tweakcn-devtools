import type { ThemeCatalogEntry, ThemeStyleProps, ThemeStyles } from "./types";

export interface RegistryItem {
  name: string;
  title?: string;
  cssVars?: {
    theme?: ThemeStyleProps;
    light?: ThemeStyleProps;
    dark?: ThemeStyleProps;
  };
}

export interface CommunityThemeRow {
  id: string;
  themeId: string;
  name: string;
  styles: ThemeStyles;
  tags?: string[];
  author?: { name?: string };
  likeCount?: number;
}

function merge(base?: ThemeStyleProps, mode?: ThemeStyleProps): ThemeStyleProps {
  return { ...(base ?? {}), ...(mode ?? {}) };
}

export function mapRegistryItem(item: RegistryItem): ThemeCatalogEntry {
  return {
    id: item.name,
    name: item.title ?? item.name,
    source: "preset",
    styles: {
      light: merge(item.cssVars?.theme, item.cssVars?.light),
      dark: merge(item.cssVars?.theme, item.cssVars?.dark),
    },
  };
}

export function mapCommunityRow(row: CommunityThemeRow): ThemeCatalogEntry {
  return {
    id: row.themeId,
    name: row.name,
    source: "community",
    styles: row.styles,
    tags: row.tags,
    author: row.author?.name,
    likeCount: row.likeCount,
  };
}
