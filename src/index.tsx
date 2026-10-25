import { createElement, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { installLivePreviewBridge } from "./live-preview-bridge";
import { TweakcnDevtoolsPanel } from "./panel";
import { isPreviewFrame } from "./preview-frame";
import type { TweakcnDevtoolsOptions } from "./types";

export type { CommunityPage, ThemeCatalogEntry, ThemeMode, ThemeStyles, TweakcnDevtoolsOptions } from "./types";
export { applyThemeStyles, captureRootThemeSnapshot, restoreThemeSnapshot } from "./apply-theme";

const HOST_ID = "tweakcn-devtools-host";

let mounted: { host: HTMLElement; root: Root } | null = null;

function ensureShadowMount(host: HTMLElement): HTMLElement {
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  let mount = shadow.querySelector("#td-mount") as HTMLElement | null;
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "td-mount";
    shadow.appendChild(mount);
  }
  return mount;
}

export function TweakcnDevtools(options: TweakcnDevtoolsOptions = {}) {
  const previewFrame = isPreviewFrame();
  const hostRef = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    installLivePreviewBridge();
  }, []);

  useLayoutEffect(() => {
    if (previewFrame) return;
    const host = hostRef.current;
    if (!host) return;
    setMount(ensureShadowMount(host));
  }, [previewFrame]);

  if (previewFrame) return null;

  return (
    <div ref={hostRef} id={HOST_ID}>
      {mount ? createPortal(createElement(TweakcnDevtoolsPanel, options), mount) : null}
    </div>
  );
}

export function initTweakcnDevtools(options: TweakcnDevtoolsOptions = {}) {
  if (typeof document === "undefined") return () => undefined;
  installLivePreviewBridge();
  if (isPreviewFrame()) return () => undefined;
  if (mounted || document.getElementById(HOST_ID)) {
    return destroyTweakcnDevtools;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.documentElement.appendChild(host);
  const mount = ensureShadowMount(host);
  const root = createRoot(mount);
  root.render(createElement(TweakcnDevtoolsPanel, options));
  mounted = { host, root };
  return destroyTweakcnDevtools;
}

export function destroyTweakcnDevtools() {
  mounted?.root.unmount();
  mounted?.host.remove();
  mounted = null;
  document.getElementById(HOST_ID)?.remove();
}
