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

function clipEditor(frame: HTMLIFrameElement, rect: DOMRect) {
  const width = frame.clientWidth;
  const height = frame.clientHeight;
  const x1 = Math.max(0, rect.left);
  const y1 = Math.max(0, rect.top);
  const x2 = Math.min(width, rect.right);
  const y2 = Math.min(height, rect.bottom);
  frame.style.clipPath = `polygon(evenodd, 0px 0px, ${width}px 0px, ${width}px ${height}px, 0px ${height}px, 0px 0px, ${x1}px ${y1}px, ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px, ${x1}px ${y1}px)`;
}

function syncFrame(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument;
  if (!doc) return;
  const pane = findPreviewPane(doc);
  if (pane) {
    const rect = visiblePane(frame, pane.getBoundingClientRect());
    if (rect) {
      placeSite(rect);
      clipEditor(frame, rect);
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
      subtree: true,
      attributeFilter: ["style", "class"],
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
