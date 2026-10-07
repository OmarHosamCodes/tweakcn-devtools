import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyThemeStyles,
  captureRootThemeSnapshot,
  restoreThemeSnapshot,
  type RootThemeSnapshot,
} from "./apply-theme";
import { getBundledCommunityThemes, getPredefinedThemes } from "./catalog";
import { DEFAULT_COMMUNITY_PATH, fetchCommunityPage } from "./community";
import { panelStyles } from "./panel-styles";
import type { ThemeCatalogEntry, ThemeMode, TweakcnDevtoolsOptions } from "./types";

type Tab = "presets" | "community";

function filterThemes(themes: ThemeCatalogEntry[], query: string): ThemeCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return themes;
  return themes.filter(
    (theme) =>
      theme.name.toLowerCase().includes(q) ||
      theme.id.toLowerCase().includes(q) ||
      theme.tags?.some((tag) => tag.toLowerCase().includes(q)),
  );
}

function ThemeCard({
  entry,
  active,
  mode,
  onSelect,
}: {
  entry: ThemeCatalogEntry;
  active: boolean;
  mode: ThemeMode;
  onSelect: () => void;
}) {
  const styles = entry.styles[mode];
  return (
    <button
      type="button"
      className="td-card"
      data-active={active}
      aria-pressed={active}
      onClick={onSelect}
    >
      <div className="td-preview" style={{ background: styles.background }} aria-hidden>
        <span className="td-chip" style={{ background: styles.primary }} />
        <span className="td-barline" style={{ background: styles.muted ?? styles.accent }} />
      </div>
      <div className="td-meta">
        <div className="td-name">{entry.name}</div>
        {entry.author ? <div className="td-sub">{entry.author}</div> : null}
      </div>
    </button>
  );
}

function SwatchMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <rect x="1" y="1" width="7" height="16" rx="2" fill="#f4f4f5" />
      <rect x="9" y="1" width="8" height="7" rx="2" fill="#a1a1aa" />
      <rect x="9" y="10" width="8" height="7" rx="2" fill="#52525b" />
    </svg>
  );
}

export function TweakcnDevtoolsPanel(options: TweakcnDevtoolsOptions) {
  const [open, setOpen] = useState(options.initialIsOpen ?? false);
  const [tab, setTab] = useState<Tab>("presets");
  const [mode, setMode] = useState<ThemeMode>(options.defaultMode ?? "light");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ThemeCatalogEntry | null>(null);
  const bundledCommunity = useMemo(() => getBundledCommunityThemes(), []);
  const [community, setCommunity] = useState<ThemeCatalogEntry[]>(bundledCommunity);
  const [cursor, setCursor] = useState<string | number | null>(bundledCommunity.length);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);
  const baselineRef = useRef<RootThemeSnapshot | null>(null);
  const presets = useMemo(() => getPredefinedThemes(), []);
  const communityUrl = options.communityUrl ?? DEFAULT_COMMUNITY_PATH;

  const visible = useMemo(() => {
    switch (tab) {
      case "presets":
        return filterThemes(presets, query);
      case "community":
        return filterThemes(community, query);
      default: {
        const _never: never = tab;
        return _never;
      }
    }
  }, [tab, presets, community, query]);

  const apply = useCallback((entry: ThemeCatalogEntry, nextMode: ThemeMode) => {
    if (!baselineRef.current) {
      baselineRef.current = captureRootThemeSnapshot();
    }
    applyThemeStyles(document.documentElement, entry.styles, nextMode);
  }, []);

  useEffect(() => {
    if (active) apply(active, mode);
  }, [active, mode, apply]);

  const restoreOriginal = () => {
    if (baselineRef.current) restoreThemeSnapshot(baselineRef.current);
    setActive(null);
  };

  const loadMore = async () => {
    if (cursor == null || communityLoading || options.disableCommunity) return;
    setCommunityLoading(true);
    setCommunityError(null);
    try {
      const page = await fetchCommunityPage(communityUrl, cursor);
      setCommunity((prev) => {
        const seen = new Set(prev.map((theme) => theme.id));
        return [...prev, ...page.themes.filter((theme) => !seen.has(theme.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      setCommunityError("Couldn't load more community themes. Try again.");
    } finally {
      setCommunityLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const countLabel = (() => {
    switch (tab) {
      case "presets":
        return `${visible.length} presets`;
      case "community":
        return `${visible.length} community`;
      default: {
        const _never: never = tab;
        return _never;
      }
    }
  })();

  return (
    <div
      className="td-root"
      style={{ ["--td-z" as string]: String(options.zIndex ?? 2147483646) }}
    >
      <style>{panelStyles}</style>
      {open ? (
        <aside className="td-dock" aria-label="Theme preview">
          <div className="td-bar">
            <p className="td-title">Theme</p>
            <div className="td-cluster" role="tablist" aria-label="Theme source">
              <button
                type="button"
                className="td-tab"
                role="tab"
                aria-selected={tab === "presets"}
                data-active={tab === "presets"}
                onClick={() => setTab("presets")}
              >
                Presets
              </button>
              <button
                type="button"
                className="td-tab"
                role="tab"
                aria-selected={tab === "community"}
                data-active={tab === "community"}
                disabled={options.disableCommunity}
                onClick={() => setTab("community")}
              >
                Community
              </button>
            </div>
            <div className="td-search-wrap">
              <label className="td-search-label" htmlFor="td-theme-search">
                Search themes
              </label>
              <input
                id="td-theme-search"
                className="td-search"
                placeholder="Search themes"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="td-cluster" role="group" aria-label="Appearance">
              <button
                type="button"
                className="td-btn"
                data-active={mode === "light"}
                aria-pressed={mode === "light"}
                onClick={() => setMode("light")}
              >
                Light
              </button>
              <button
                type="button"
                className="td-btn"
                data-active={mode === "dark"}
                aria-pressed={mode === "dark"}
                onClick={() => setMode("dark")}
              >
                Dark
              </button>
              <button
                type="button"
                className="td-btn"
                onClick={restoreOriginal}
                disabled={!active}
                aria-label="Restore original theme"
              >
                Restore
              </button>
            </div>
            <button
              type="button"
              className="td-btn"
              aria-label="Close theme preview"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="td-list" role="list">
            {tab === "community" && communityLoading && community.length === 0
              ? Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="td-skeleton" aria-hidden>
                    <div className="td-preview" />
                    <div className="td-meta" style={{ height: 36 }} />
                  </div>
                ))
              : null}
            {visible.map((entry) => (
              <ThemeCard
                key={`${entry.source}-${entry.id}`}
                entry={entry}
                active={active?.id === entry.id}
                mode={mode}
                onSelect={() => setActive(entry)}
              />
            ))}
            {visible.length === 0 && !communityLoading ? (
              <p className="td-empty">
                {query.trim() ? "No themes match that search." : "No community themes loaded."}
              </p>
            ) : null}
            {communityError && tab === "community" ? <p className="td-error">{communityError}</p> : null}
          </div>

          <footer className="td-foot">
            <span>{countLabel}</span>
            {tab === "community" && cursor != null ? (
              <button
                type="button"
                className="td-btn"
                disabled={communityLoading}
                onClick={() => void loadMore()}
              >
                {communityLoading ? "Loading" : "Load more"}
              </button>
            ) : (
              <span>{active ? `${active.name} applied` : "Pick a theme to preview"}</span>
            )}
          </footer>
        </aside>
      ) : (
        <button
          type="button"
          className="td-toggle"
          aria-label="Open theme preview"
          onClick={() => setOpen(true)}
        >
          <SwatchMark />
        </button>
      )}
    </div>
  );
}
