const PLACE_STYLE_ID = "tweakcn-devtools-site-place";
const FRAME_ID = "tweakcn-devtools-site-frame";

const placeCss = `
#tweakcn-devtools-site-frame {
  position: fixed;
  left: var(--td-site-left);
  top: var(--td-site-top);
  width: var(--td-site-width);
  height: var(--td-site-height);
  box-sizing: border-box;
  border-radius: 18px;
  border: 1px solid rgb(255 255 255 / 0.16);
  background: rgb(0 0 0 / 0.28);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.45),
    0 22px 50px rgb(0 0 0 / 0.28);
  pointer-events: none;
  z-index: 2147483644;
}

html.td-site-placed body {
  position: fixed !important;
  left: calc(var(--td-site-left) + 12px) !important;
  top: calc(var(--td-site-top) + 12px) !important;
  width: calc(var(--td-site-width) - 24px) !important;
  height: calc(var(--td-site-height) - 24px) !important;
  margin: 0 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: calc(var(--td-site-width) - 24px) !important;
  max-height: calc(var(--td-site-height) - 24px) !important;
  overflow: auto !important;
  border-radius: 12px !important;
  z-index: 2147483645 !important;
  /* No transform here. A transform would trap the editor iframe, which is a
     fixed descendant of body, and shrink tweakcn into its narrow layout. */
}

html.td-site-placed body * {
  min-width: 0 !important;
}
`;

function ensurePlaceStyle() {
  let style = document.getElementById(PLACE_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = PLACE_STYLE_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== placeCss) style.textContent = placeCss;
}

function ensureFrame() {
  let frame = document.getElementById(FRAME_ID);
  if (!frame) {
    frame = document.createElement("div");
    frame.id = FRAME_ID;
    frame.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(frame);
  }
  return frame;
}

function findPreviewPane(doc: Document): HTMLElement | null {
  const custom = [...doc.querySelectorAll<HTMLElement>('[role="tab"], button')].find(
    (tab) => tab.textContent?.trim() === "Custom",
  );
  if (!custom) return null;
  const tablist = custom.closest<HTMLElement>('[role="tablist"]');
  let column: HTMLElement | null = custom.parentElement;
  while (column && column !== doc.body) {
    const rect = column.getBoundingClientRect();
    if (rect.width >= 280 && rect.height >= 240 && rect.left >= 80) break;
    column = column.parentElement;
  }
  if (!column || column === doc.body) return null;
  const headerBottom = tablist?.getBoundingClientRect().bottom ?? 0;
  let best: HTMLElement | null = null;
  let bestArea = 0;
  for (const child of column.children) {
    const element = child as HTMLElement;
    const rect = element.getBoundingClientRect();
    if (rect.top + 4 < headerBottom) continue;
    if (rect.width < 280 || rect.height < 240 || rect.left < 80) continue;
    const area = rect.width * rect.height;
    if (area > bestArea) {
      best = element;
      bestArea = area;
    }
  }
  return best ?? column;
}

function findThemeElement(doc: Document): HTMLElement | null {
  const nodes = [...doc.querySelectorAll<HTMLElement>("[style*='--background']")];
  let best: HTMLElement | null = null;
  let bestCount = 0;
  for (const node of nodes) {
    let count = 0;
    for (const prop of node.style) {
      if (prop.startsWith("--")) count += 1;
    }
    if (count > bestCount) {
      best = node;
      bestCount = count;
    }
  }
  return best;
}

function isDarkTheme(source: HTMLElement): boolean {
  let node: HTMLElement | null = source;
  for (let depth = 0; depth < 6 && node; depth += 1) {
    if (node.classList.contains("dark")) return true;
    node = node.parentElement;
  }
  return false;
}

const copiedProps = new Set<string>();

function copyTheme(source: HTMLElement) {
  const host = document.documentElement;
  for (const prop of copiedProps) host.style.removeProperty(prop);
  copiedProps.clear();
  for (const prop of source.style) {
    if (!prop.startsWith("--")) continue;
    host.style.setProperty(prop, source.style.getPropertyValue(prop));
    copiedProps.add(prop);
  }
  host.classList.toggle("dark", isDarkTheme(source));
}

function placeSite(rect: DOMRect) {
  ensurePlaceStyle();
  ensureFrame();
  const root = document.documentElement;
  root.classList.add("td-site-placed");
  root.style.setProperty("--td-site-left", `${Math.round(rect.left)}px`);
  root.style.setProperty("--td-site-top", `${Math.round(rect.top)}px`);
  root.style.setProperty("--td-site-width", `${Math.round(rect.width)}px`);
  root.style.setProperty("--td-site-height", `${Math.round(rect.height)}px`);
}

function visiblePane(frame: HTMLIFrameElement, rect: DOMRect): DOMRect | null {
  const left = Math.max(0, rect.left);
  const top = Math.max(0, rect.top);
  const right = Math.min(frame.clientWidth, rect.right);
  const bottom = Math.min(frame.clientHeight, rect.bottom);
  const width = right - left;
  const height = bottom - top;
  if (width < 280 || height < 240) return null;
  return new DOMRect(left, top, width, height);
}

export function clearEditorSite() {
  const root = document.documentElement;
  root.classList.remove("td-site-placed");
  root.style.removeProperty("--td-site-left");
  root.style.removeProperty("--td-site-top");
  root.style.removeProperty("--td-site-width");
  root.style.removeProperty("--td-site-height");
  document.getElementById(FRAME_ID)?.remove();
}

function rectPath(rect: DOMRect): string {
  const x1 = Math.round(rect.left);
  const y1 = Math.round(rect.top);
  const x2 = Math.round(rect.right);
  const y2 = Math.round(rect.bottom);
  return `${x1}px ${y1}px, ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px, ${x1}px ${y1}px`;
}

function intersection(a: DOMRect, b: DOMRect): DOMRect | null {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  if (right - left < 1 || bottom - top < 1) return null;
  return new DOMRect(left, top, right - left, bottom - top);
}

/** Menus and dialogs that overlap the preview must stay visible above the page. */
function overlayRects(doc: Document, hole: DOMRect): DOMRect[] {
  const nodes = [
    ...doc.querySelectorAll<HTMLElement>(
      '[data-radix-popper-content-wrapper], [role="dialog"][data-state="open"], [role="menu"][data-state="open"], [role="listbox"]',
    ),
  ];
  const outer = nodes.filter((node) => !nodes.some((other) => other !== node && other.contains(node)));
  const rects: DOMRect[] = [];
  for (const node of outer) {
    const overlap = intersection(hole, node.getBoundingClientRect());
    if (overlap) rects.push(overlap);
  }
  return rects;
}

function clipEditor(frame: HTMLIFrameElement, hole: DOMRect, overlays: DOMRect[]) {
  const width = frame.clientWidth;
  const height = frame.clientHeight;
  const parts = [
    `0px 0px, ${width}px 0px, ${width}px ${height}px, 0px ${height}px, 0px 0px`,
    rectPath(hole),
    ...overlays.map(rectPath),
  ];
  frame.style.clipPath = `polygon(evenodd, ${parts.join(", ")})`;
}

const SOCIAL_HREFS = ["github.com/jnsahaj/tweakcn", "discord.gg/", "x.com/iamsahaj"];
const HEADER_LABELS = new Set(["Sign In", "Sign Up", "Get Pro"]);

function labelOf(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

function isSocialLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href") ?? "";
  return SOCIAL_HREFS.some((part) => href.includes(part));
}

/** Drop tweakcn's account wall and the social links in the editor header. */
function stripEditorChrome(doc: Document) {
  const groups = new Set<HTMLElement>();
  for (const anchor of doc.querySelectorAll("a")) {
    if (!isSocialLink(anchor)) continue;
    if (anchor.parentElement) groups.add(anchor.parentElement);
    anchor.remove();
  }
  for (const group of groups) {
    const next = group.nextElementSibling;
    if (group.childElementCount === 0) group.remove();
    if (next?.getAttribute("data-orientation")) next.remove();
  }

  for (const button of doc.querySelectorAll("button")) {
    if (HEADER_LABELS.has(labelOf(button))) button.remove();
  }

  for (const dialog of doc.querySelectorAll('[role="dialog"]')) {
    const text = labelOf(dialog);
    if (!/sign in|create account|welcome back|get pro|upgrade to pro/i.test(text)) continue;
    const close = [...dialog.querySelectorAll("button")].find((button) =>
      /close/i.test(`${labelOf(button)} ${button.getAttribute("aria-label") ?? ""}`),
    );
    if (close) close.click();
    else dialog.remove();
  }
}

function syncFrame(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument;
  if (!doc) return;
  stripEditorChrome(doc);
  const pane = findPreviewPane(doc);
  if (pane) {
    const rect = visiblePane(frame, pane.getBoundingClientRect());
    if (rect) {
      placeSite(rect);
      clipEditor(frame, rect, overlayRects(doc, rect));
    }
  }
  const theme = findThemeElement(doc);
  if (theme) copyTheme(theme);
}

/** Keep tweakcn's controls, and fit the current page into the preview section. */
export function bindEditorSite(frame: HTMLIFrameElement): () => void {
  let timer = 0;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => syncFrame(frame), 32);
  };
  const onLoad = () => schedule();
  frame.addEventListener("load", onLoad);
  const observer = new MutationObserver(schedule);
  const attachObserver = () => {
    const doc = frame.contentDocument;
    if (!doc) return;
    observer.observe(doc.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["style", "class", "data-state"],
    });
    schedule();
  };
  frame.addEventListener("load", attachObserver);
  attachObserver();
  const poll = window.setInterval(schedule, 500);
  window.addEventListener("resize", schedule);
  return () => {
    window.clearTimeout(timer);
    window.clearInterval(poll);
    window.removeEventListener("resize", schedule);
    frame.removeEventListener("load", onLoad);
    frame.removeEventListener("load", attachObserver);
    observer.disconnect();
    frame.style.clipPath = "";
    clearEditorSite();
  };
}
