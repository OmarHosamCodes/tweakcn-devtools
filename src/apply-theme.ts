import type { ThemeMode, ThemeStyleProps, ThemeStyles } from "./types";

const FONT_SHEET_ID = "tweakcn-devtools-font-overrides";
const SHADOW_SHEET_ID = "tweakcn-devtools-shadow-overrides";
const DEFAULT_FONT_WEIGHTS = ["400", "500", "600", "700"];
const SYSTEM_FONTS = new Set([
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
]);

export interface RootThemeSnapshot {
  className: string;
  style: string;
}

function ownerDocument(root: HTMLElement): Document {
  return root.ownerDocument ?? document;
}

function upsertSheet(doc: Document, id: string): HTMLStyleElement {
  let sheet = doc.getElementById(id) as HTMLStyleElement | null;
  if (!sheet) {
    sheet = doc.createElement("style");
    sheet.id = id;
    doc.head.appendChild(sheet);
  }
  return sheet;
}

function extractFontFamily(fontFamilyValue: string | undefined): string | null {
  const first = fontFamilyValue?.split(",")[0]?.trim().replace(/['"]/g, "");
  if (!first || SYSTEM_FONTS.has(first.toLowerCase())) return null;
  return first;
}

function loadGoogleFont(doc: Document, family: string) {
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${DEFAULT_FONT_WEIGHTS.join(";")}&display=swap`;
  if (doc.querySelector(`link[href="${href}"]`)) return;
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.dataset.tweakcnFont = family;
  link.href = href;
  doc.head.appendChild(link);
}

function applyFonts(root: HTMLElement, styles: ThemeStyleProps) {
  const doc = ownerDocument(root);
  const fonts = {
    sans: styles["font-sans"],
    serif: styles["font-serif"],
    mono: styles["font-mono"],
  };
  for (const value of Object.values(fonts)) {
    const family = extractFontFamily(value);
    if (family) loadGoogleFont(doc, family);
  }
  const rules: string[] = [];
  if (fonts.sans) rules.push(`.font-sans { font-family: ${fonts.sans} !important; }`);
  if (fonts.serif) rules.push(`.font-serif { font-family: ${fonts.serif} !important; }`);
  if (fonts.mono) rules.push(`.font-mono { font-family: ${fonts.mono} !important; }`);
  upsertSheet(doc, FONT_SHEET_ID).textContent = rules.join("\n");
}

function shadowLayers(styles: ThemeStyleProps): Record<string, string> {
  const shadowColor = styles["shadow-color"] ?? "hsl(0 0% 0%)";
  const offsetX = styles["shadow-offset-x"] ?? "0";
  const offsetY = styles["shadow-offset-y"] ?? "1px";
  const blur = styles["shadow-blur"] ?? "3px";
  const spread = styles["shadow-spread"] ?? "0px";
  const opacity = Number.parseFloat(styles["shadow-opacity"] ?? "0.1");
  const color = (mult: number) =>
    `color-mix(in srgb, ${shadowColor} calc(${opacity * mult} * 100%), transparent)`;
  const second = (y: string, b: string) =>
    `${offsetX} ${y} ${b} ${Number.parseFloat(spread) - 1}px ${color(1)}`;
  const base = (mult: number) => `${offsetX} ${offsetY} ${blur} ${spread} ${color(mult)}`;
  return {
    "shadow-2xs": base(0.5),
    "shadow-xs": base(0.5),
    "shadow-2xl": base(2.5),
    "shadow-sm": `${base(1)}, ${second("1px", "2px")}`,
    shadow: `${base(1)}, ${second("1px", "2px")}`,
    "shadow-md": `${base(1)}, ${second("2px", "4px")}`,
    "shadow-lg": `${base(1)}, ${second("4px", "6px")}`,
    "shadow-xl": `${base(1)}, ${second("8px", "10px")}`,
  };
}

function applyShadows(root: HTMLElement, styles: ThemeStyles, mode: ThemeMode) {
  const merged = { ...styles.light, ...styles[mode] };
  const sheet = upsertSheet(ownerDocument(root), SHADOW_SHEET_ID);
  sheet.textContent = Object.entries(shadowLayers(merged))
    .map(([name, value]) => `.${name} { box-shadow: ${value} !important; }`)
    .join("\n");
}

export function applyThemeStyles(root: HTMLElement, styles: ThemeStyles, mode: ThemeMode) {
  root.classList.toggle("dark", mode === "dark");
  for (const [key, value] of Object.entries(styles.light ?? {})) {
    if (value.trim()) root.style.setProperty(`--${key}`, value);
  }
  if (mode === "dark") {
    for (const [key, value] of Object.entries(styles.dark ?? {})) {
      if (value.trim()) root.style.setProperty(`--${key}`, value);
    }
  }
  applyFonts(root, styles.light);
  applyShadows(root, styles, mode);
}

export function captureRootThemeSnapshot(root: HTMLElement = document.documentElement): RootThemeSnapshot {
  return {
    className: root.className,
    style: root.getAttribute("style") ?? "",
  };
}

export function restoreThemeSnapshot(
  snapshot: RootThemeSnapshot,
  root: HTMLElement = document.documentElement,
) {
  root.className = snapshot.className;
  if (snapshot.style) root.setAttribute("style", snapshot.style);
  else root.removeAttribute("style");
  const doc = ownerDocument(root);
  doc.getElementById(FONT_SHEET_ID)?.remove();
  doc.getElementById(SHADOW_SHEET_ID)?.remove();
}
