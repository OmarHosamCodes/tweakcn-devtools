/** Marks a framed copy of this page so the panel does not mount inside itself. */
export const PREVIEW_PARAM = "td-preview";

export function isPreviewFrame(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(PREVIEW_PARAM) === "1";
}

/** Zustand persist key used by tweakcn's Custom website preview. */
export const TWEAKCN_PREVIEW_STORAGE_KEY = "website-preview-storage";

/** Same-origin path the Vite plugin serves as the real tweakcn editor. */
export const TWEAKCN_EDITOR_PATH = "/editor/theme?p=custom";
