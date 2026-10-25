import { TWEAKCN_APP_PATH } from "./community";

/** localStorage payload the embedded editor reads when it boots. */
export const APP_THEME_STORAGE_KEY = "tweakcn-devtools-app-theme";

const EDITOR_STORAGE_KEY = "editor-storage";

/** Tokens the tweakcn editor understands. Other custom properties stay in the app. */
const STYLE_KEYS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "radius",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "font-sans",
  "font-serif",
  "font-mono",
  "shadow-color",
  "shadow-opacity",
  "shadow-blur",
  "shadow-spread",
  "shadow-offset-x",
  "shadow-offset-y",
  "letter-spacing",
  "spacing",
] as const;

const SKIP_SHEET_IDS = new Set([
  "tweakcn-devtools-site-place",
  "tweakcn-devtools-font-overrides",
  "tweakcn-devtools-shadow-overrides",
]);

export interface AppThemeStyles {
  light: Record<string, string>;
  dark: Record<string, string>;
}

function selectorBuckets(selector: string): Array<"light" | "dark"> {
  const buckets: Array<"light" | "dark"> = [];
  for (const part of selector.split(",")) {
    const sel = part.trim();
    if (sel === ":root" || sel === "html") buckets.push("light");
    if (sel === ".dark" || sel === ":root.dark" || sel === "html.dark" || sel === ".dark:root") {
      buckets.push("dark");
    }
  }
  return buckets;
}

function resolveValue(value: string, scope: Record<string, string>, depth = 0): string {
  if (depth > 8 || !value.includes("var(")) return value.trim();
  return value
    .replace(/var\(\s*--([\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_match, name: string, fallback?: string) => {
      const next = scope[name];
      if (next) return resolveValue(next, scope, depth + 1);
      if (fallback) return resolveValue(fallback.trim(), scope, depth + 1);
      return "";
    })
    .trim();
}

function readRuleList(rules: CSSRuleList, into: CSSStyleRule[]): void {
  for (const rule of rules) {
    if (rule instanceof CSSStyleRule) {
      into.push(rule);
      continue;
    }
    if (rule instanceof CSSImportRule && rule.styleSheet) {
      try {
        readRuleList(rule.styleSheet.cssRules, into);
      } catch {
        // Cross-origin imports are not readable.
      }
      continue;
    }
    if ("cssRules" in rule && rule.cssRules instanceof CSSRuleList) {
      readRuleList(rule.cssRules, into);
    }
  }
}

function collectCustomProps(): { light: Record<string, string>; dark: Record<string, string> } {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  for (const sheet of document.styleSheets) {
    const node = sheet.ownerNode;
    if (node instanceof Element && SKIP_SHEET_IDS.has(node.id)) continue;
    const rules: CSSStyleRule[] = [];
    try {
      readRuleList(sheet.cssRules, rules);
    } catch {
      continue;
    }
    for (const rule of rules) {
      const buckets = selectorBuckets(rule.selectorText);
      if (buckets.length === 0) continue;
      for (const prop of rule.style) {
        if (!prop.startsWith("--")) continue;
        const value = rule.style.getPropertyValue(prop).trim();
        if (!value) continue;
        const key = prop.slice(2);
        for (const bucket of buckets) {
          if (bucket === "light") light[key] = value;
          else dark[key] = value;
        }
      }
    }
  }
  return { light, dark };
}

function project(raw: Record<string, string>, fallback: Record<string, string>): Record<string, string> {
  const scope = { ...fallback, ...raw };
  const styles: Record<string, string> = {};
  for (const key of STYLE_KEYS) {
    const value = scope[key];
    if (!value) continue;
    const resolved = resolveValue(value, scope);
    if (resolved) styles[key] = resolved;
  }
  return styles;
}

/** Read the app's authored :root and .dark tokens, ignoring inline preview overrides. */
export function readAppThemeStyles(): AppThemeStyles | null {
  const collected = collectCustomProps();
  const light = project(collected.light, {});
  if (Object.keys(light).length < 4) return null;
  const dark = project(collected.dark, collected.light);
  return { light, dark };
}

interface PersistedEditor {
  state?: {
    themeState?: {
      currentMode?: "light" | "dark";
      hslAdjustments?: { hueShift: number; saturationScale: number; lightnessScale: number };
    };
    [key: string]: unknown;
  };
  version?: number;
}

/**
 * Store the app theme under its package name and point the editor at it.
 * The editor iframe shares this origin, so it hydrates the same record.
 */
export function seedAppTheme(name: string): boolean {
  const styles = readAppThemeStyles();
  if (!styles) return false;
  let createdAt = new Date().toISOString();
  try {
    const previous = JSON.parse(localStorage.getItem(APP_THEME_STORAGE_KEY) ?? "null") as {
      id?: string;
      createdAt?: string;
    } | null;
    if (previous?.id === name && previous.createdAt) createdAt = previous.createdAt;
  } catch {
    // A broken record is replaced below.
  }
  localStorage.setItem(
    APP_THEME_STORAGE_KEY,
    JSON.stringify({ id: name, label: name, styles, createdAt }),
  );

  let persisted: PersistedEditor = { state: {}, version: 0 };
  try {
    const raw = localStorage.getItem(EDITOR_STORAGE_KEY);
    if (raw) persisted = JSON.parse(raw) as PersistedEditor;
  } catch {
    persisted = { state: {}, version: 0 };
  }
  const currentMode = document.documentElement.classList.contains("dark")
    ? "dark"
    : (persisted.state?.themeState?.currentMode ?? "light");
  const themeState = {
    styles,
    currentMode,
    hslAdjustments: persisted.state?.themeState?.hslAdjustments ?? {
      hueShift: 0,
      saturationScale: 1,
      lightnessScale: 1,
    },
    preset: name,
  };
  localStorage.setItem(
    EDITOR_STORAGE_KEY,
    JSON.stringify({
      ...persisted,
      state: {
        ...(persisted.state ?? {}),
        themeState,
        themeCheckpoint: themeState,
        history: [],
        future: [],
      },
      version: persisted.version ?? 0,
    }),
  );
  return true;
}

export async function fetchAppPackageName(): Promise<string | null> {
  try {
    const response = await fetch(TWEAKCN_APP_PATH, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const body = (await response.json()) as { name?: unknown };
    return typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  } catch {
    return null;
  }
}
