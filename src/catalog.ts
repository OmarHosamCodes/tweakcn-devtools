import registry from "./data/predefined-registry.json";
import snapshot from "./data/community-snapshot.json";
import { mapCommunityRow, mapRegistryItem, type CommunityThemeRow, type RegistryItem } from "./map-theme";
import type { ThemeCatalogEntry } from "./types";

export function getPredefinedThemes(): ThemeCatalogEntry[] {
  const items = (registry as { items: RegistryItem[] }).items ?? [];
  return items.map(mapRegistryItem);
}

export function getBundledCommunityThemes(): ThemeCatalogEntry[] {
  const themes = (snapshot as { themes: CommunityThemeRow[] }).themes ?? [];
  return themes.map(mapCommunityRow);
}
