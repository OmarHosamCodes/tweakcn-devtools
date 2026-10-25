import { applyThemeStyles } from "./apply-theme";
import type { ThemeMode, ThemeStyles } from "./types";

const FLAG = "__tweakcnDevtoolsBridge";

const MESSAGE = {
  PING: "TWEAKCN_PING",
  PONG: "TWEAKCN_PONG",
  CHECK_SHADCN: "TWEAKCN_CHECK_SHADCN",
  SHADCN_STATUS: "TWEAKCN_SHADCN_STATUS",
  THEME_UPDATE: "TWEAKCN_THEME_UPDATE",
  THEME_APPLIED: "TWEAKCN_THEME_APPLIED",
  EMBED_LOADED: "TWEAKCN_EMBED_LOADED",
} as const;

const ALLOWED_PARENT_ORIGINS = new Set(["https://tweakcn.com", "http://localhost:3000"]);

const REQUIRED_SHADCN_VARS = [
  "--radius",
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
];

interface BridgeWindow extends Window {
  __tweakcnDevtoolsBridge?: boolean;
}

interface ThemeUpdatePayload {
  themeState?: {
    currentMode?: string;
    styles?: ThemeStyles;
  };
}

function postToParent(message: { type: string; payload?: unknown }) {
  if (!window.parent || window.parent === window) return;
  window.parent.postMessage(message, "*");
}

function hasShadcnVariables(): boolean {
  const styles = getComputedStyle(document.documentElement);
  return REQUIRED_SHADCN_VARS.every((name) => styles.getPropertyValue(name).trim() !== "");
}

function applyPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return;
  const themeState = (payload as ThemeUpdatePayload).themeState;
  if (!themeState?.styles) return;
  const mode: ThemeMode = themeState.currentMode === "dark" ? "dark" : "light";
  applyThemeStyles(document.documentElement, themeState.styles, mode);
}

function parentOriginAllowed(origin: string): boolean {
  return origin === window.location.origin || ALLOWED_PARENT_ORIGINS.has(origin);
}

/**
 * Answers tweakcn's live-preview messages so the real editor can theme this page.
 * Safe to call more than once.
 */
export function installLivePreviewBridge(): void {
  if (typeof window === "undefined") return;
  const target = window as BridgeWindow;
  if (target[FLAG]) return;
  target[FLAG] = true;

  window.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as { type?: unknown; payload?: unknown } | null;
    if (!data || typeof data.type !== "string") return;

    const fromParent = event.source === window.parent && window.parent !== window;
    if (fromParent) {
      if (!parentOriginAllowed(event.origin)) return;
      switch (data.type) {
        case MESSAGE.PING:
          postToParent({ type: MESSAGE.PONG });
          return;
        case MESSAGE.CHECK_SHADCN:
          postToParent({
            type: MESSAGE.SHADCN_STATUS,
            payload: { supported: hasShadcnVariables() },
          });
          return;
        case MESSAGE.THEME_UPDATE:
          applyPayload(data.payload);
          postToParent({ type: MESSAGE.THEME_APPLIED });
          if (window.top && window.top !== window) {
            try {
              window.top.postMessage(data, window.location.origin);
            } catch {
              // The top window is a different origin.
            }
          }
          return;
        default:
          return;
      }
    }

    const atTop = window.parent === window;
    if (atTop && data.type === MESSAGE.THEME_UPDATE && event.origin === window.location.origin) {
      applyPayload(data.payload);
    }
  });

  if (window.parent !== window) {
    postToParent({ type: MESSAGE.EMBED_LOADED });
  }
}
