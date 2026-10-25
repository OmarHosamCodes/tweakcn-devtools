import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyThemeStyles,
  captureRootThemeSnapshot,
  restoreThemeSnapshot,
  type RootThemeSnapshot,
} from "./apply-theme";
import { getBundledCommunityThemes, getPredefinedThemes } from "./catalog";
import { DEFAULT_COMMUNITY_PATH, fetchCommunityPage } from "./community";
import { bindEditorSite, clearEditorSite } from "./editor-site";
import { panelStyles } from "./panel-styles";
import { TWEAKCN_EDITOR_PATH, TWEAKCN_PREVIEW_STORAGE_KEY } from "./preview-frame";
import type { ThemeCatalogEntry, ThemeMode, TweakcnDevtoolsOptions } from "./types";

type Tab = "presets" | "community";
type View = "dock" | "extended";

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

function SourceTabs({
  tab,
  disableCommunity,
  onChange,
}: {
  tab: Tab;
  disableCommunity?: boolean;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="td-cluster" role="tablist" aria-label="Theme source">
      <button
        type="button"
        className="td-tab"
        role="tab"
        aria-selected={tab === "presets"}
        data-active={tab === "presets"}
        onClick={() => onChange("presets")}
      >
        Presets
      </button>
      <button
        type="button"
        className="td-tab"
        role="tab"
        aria-selected={tab === "community"}
        data-active={tab === "community"}
        disabled={disableCommunity}
        onClick={() => onChange("community")}
      >
        Community
      </button>
    </div>
  );
}

function AppearanceControls({
  mode,
  canRestore,
  onMode,
  onRestore,
}: {
  mode: ThemeMode;
  canRestore: boolean;
  onMode: (mode: ThemeMode) => void;
  onRestore: () => void;
}) {
  return (
    <div className="td-cluster" role="group" aria-label="Appearance">
      <button
        type="button"
        className="td-btn"
        data-active={mode === "light"}
        aria-pressed={mode === "light"}
        onClick={() => onMode("light")}
      >
        Light
      </button>
      <button
        type="button"
        className="td-btn"
        data-active={mode === "dark"}
        aria-pressed={mode === "dark"}
        onClick={() => onMode("dark")}
      >
        Dark
      </button>
      <button
        type="button"
        className="td-btn"
        onClick={onRestore}
        disabled={!canRestore}
        aria-label="Restore original theme"
      >
        Restore
      </button>
    </div>
  );
}

function ThemeSearch({ query, onChange }: { query: string; onChange: (query: string) => void }) {
  return (
    <div className="td-search-wrap">
      <label className="td-search-label" htmlFor="td-theme-search">
        Search themes
      </label>
      <input
        id="td-theme-search"
        className="td-search"
        placeholder="Search themes"
        value={query}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ThemeList({
  tab,
  communityLoading,
  communityCount,
  visible,
  activeId,
  mode,
  query,
  communityError,
  onSelect,
}: {
  tab: Tab;
  communityLoading: boolean;
  communityCount: number;
  visible: ThemeCatalogEntry[];
  activeId: string | null;
  mode: ThemeMode;
  query: string;
  communityError: string | null;
  onSelect: (entry: ThemeCatalogEntry) => void;
}) {
  return (
    <div className="td-list" role="list">
      {tab === "community" && communityLoading && communityCount === 0
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
          active={activeId === entry.id}
          mode={mode}
          onSelect={() => onSelect(entry)}
        />
      ))}
      {visible.length === 0 && !communityLoading ? (
        <p className="td-empty">
          {query.trim() ? "No themes match that search." : "No community themes loaded."}
        </p>
      ) : null}
      {communityError && tab === "community" ? <p className="td-error">{communityError}</p> : null}
    </div>
  );
}

function ThemeFooter({
  countLabel,
  tab,
  disableCommunity,
  query,
  mode,
  cursor,
  communityLoading,
  activeName,
  canRestore,
  onTabChange,
  onQueryChange,
  onMode,
  onRestore,
  onExtend,
  onClose,
  onLoadMore,
}: {
  countLabel: string;
  tab: Tab;
  disableCommunity?: boolean;
  query: string;
  mode: ThemeMode;
  cursor: string | number | null;
  communityLoading: boolean;
  activeName: string | null;
  canRestore: boolean;
  onTabChange: (tab: Tab) => void;
  onQueryChange: (query: string) => void;
  onMode: (mode: ThemeMode) => void;
  onRestore: () => void;
  onExtend: () => void;
  onClose: () => void;
  onLoadMore: () => void;
}) {
  return (
    <footer className="td-foot">
      <div className="td-foot-controls">
        <div className="td-foot-discovery">
          <SourceTabs tab={tab} disableCommunity={disableCommunity} onChange={onTabChange} />
          <ThemeSearch query={query} onChange={onQueryChange} />
        </div>
        <div className="td-foot-actions">
          <AppearanceControls mode={mode} canRestore={canRestore} onMode={onMode} onRestore={onRestore} />
          <div className="td-cluster" role="group" aria-label="Panel">
            <button type="button" className="td-btn" onClick={onExtend}>
              Extend
            </button>
            <button type="button" className="td-btn" aria-label="Close theme preview" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
      <div className="td-foot-status">
        <span>{countLabel}</span>
        {tab === "community" && cursor != null ? (
          <button type="button" className="td-btn" disabled={communityLoading} onClick={onLoadMore}>
            {communityLoading ? "Loading" : "Load more"}
          </button>
        ) : (
          <span>{activeName ? `${activeName} applied` : "Pick a theme to preview"}</span>
        )}
      </div>
    </footer>
  );
}

export function TweakcnDevtoolsPanel(options: TweakcnDevtoolsOptions) {
  const [open, setOpen] = useState(options.initialIsOpen ?? false);
  const [view, setView] = useState<View>("dock");
  const [tab, setTab] = useState<Tab>("presets");
  const [mode, setMode] = useState<ThemeMode>(options.defaultMode ?? "light");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ThemeCatalogEntry | null>(null);
  const bundledCommunity = useMemo(() => getBundledCommunityThemes(), []);
  const [community, setCommunity] = useState<ThemeCatalogEntry[]>(bundledCommunity);
  const [cursor, setCursor] = useState<string | number | null>(bundledCommunity.length);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const baselineRef = useRef<RootThemeSnapshot | null>(null);
  const editorRef = useRef<HTMLIFrameElement>(null);
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

  const applyHost = useCallback((entry: ThemeCatalogEntry, nextMode: ThemeMode) => {
    if (!baselineRef.current) {
      baselineRef.current = captureRootThemeSnapshot();
    }
    applyThemeStyles(document.documentElement, entry.styles, nextMode);
  }, []);

  useEffect(() => {
    if (active) applyHost(active, mode);
  }, [active, mode, applyHost]);

  const closePanel = () => {
    setOpen(false);
    setView("dock");
  };

  const restoreOriginal = () => {
    if (baselineRef.current) restoreThemeSnapshot(baselineRef.current);
    setActive(null);
  };

  const openExtended = () => {
    try {
      localStorage.removeItem(TWEAKCN_PREVIEW_STORAGE_KEY);
    } catch {
      // Storage can be blocked. The editor still opens.
    }
    setEditorSrc(options.editorUrl ?? TWEAKCN_EDITOR_PATH);
    setEditorEpoch((epoch) => epoch + 1);
    setView("extended");
  };

  useEffect(() => {
    if (view !== "extended") {
      clearEditorSite();
      return;
    }
    const frame = editorRef.current;
    if (!frame) return;
    return bindEditorSite(frame);
  }, [view, editorEpoch, editorSrc]);

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
      if (event.key === "Escape") closePanel();
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

  const list = (
    <ThemeList
      tab={tab}
      communityLoading={communityLoading}
      communityCount={community.length}
      visible={visible}
      activeId={active?.id ?? null}
      mode={mode}
      query={query}
      communityError={communityError}
      onSelect={setActive}
    />
  );

  const footer = (
    <ThemeFooter
      countLabel={countLabel}
      tab={tab}
      disableCommunity={options.disableCommunity}
      query={query}
      mode={mode}
      cursor={cursor}
      communityLoading={communityLoading}
      activeName={active?.name ?? null}
      canRestore={active != null}
      onTabChange={setTab}
      onQueryChange={setQuery}
      onMode={setMode}
      onRestore={restoreOriginal}
      onExtend={openExtended}
      onClose={closePanel}
      onLoadMore={() => void loadMore()}
    />
  );

  const openPanel = () => {
    switch (view) {
      case "dock":
        return (
          <aside className="td-dock" aria-label="Theme preview">
            {list}
            {footer}
          </aside>
        );
      case "extended":
        return (
          <div className="td-extended" aria-label="tweakcn">
            <div className="td-editor-actions">
              <button type="button" className="td-btn" onClick={() => setView("dock")}>
                Dock
              </button>
              <button type="button" className="td-btn" aria-label="Close theme preview" onClick={closePanel}>
                Close
              </button>
            </div>
            {editorSrc ? (
              <iframe
                key={editorEpoch}
                ref={editorRef}
                className="td-editor"
                title="tweakcn"
                src={editorSrc}
              />
            ) : null}
          </div>
        );
      default: {
        const _never: never = view;
        return _never;
      }
    }
  };

  return (
    <div className="td-root" style={{ ["--td-z" as string]: String(options.zIndex ?? 2147483646) }}>
      <style>{panelStyles}</style>
      {open ? (
        openPanel()
      ) : (
        <button type="button" className="td-toggle" aria-label="Open theme preview" onClick={() => setOpen(true)}>
          <SwatchMark />
        </button>
      )}
    </div>
  );
}
