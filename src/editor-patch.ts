import { EDITOR_BOOT_SCRIPT } from "./editor-boot";

/** Expose tweakcn's zustand stores and keep the app preset after a signed-out reset. */
export function patchEditorBundle(source: string): string {
  let next = source;
  const editor = next.match(/useEditorStore:\(\)=>([A-Za-z_$][\w$]*)/);
  if (editor && !next.includes("__tdEditorStore")) {
    const binding = editor[1];
    next = next.replace(
      /\{name:"editor-storage"\}(\)*)\}/,
      `{name:"editor-storage"}$1;globalThis.__tdEditorStore=${binding}}`,
    );
  }

  const preset = next.match(/useThemePresetStore:\(\)=>([A-Za-z_$][\w$]*)/);
  if (preset && !next.includes("__tdPresetStore")) {
    const binding = preset[1];
    next = next.replace(
      /unloadSavedPresets:\(\)=>\{([A-Za-z_$][\w$]*)\(\{presets:([A-Za-z_$][\w$]*)\.defaultPresets\}\)\}/,
      "unloadSavedPresets:()=>{$1({presets:$2.defaultPresets});globalThis.__tdApplyAppTheme?.()}",
    );
    next = next.replace(
      /getAllPresets:\(\)=>([A-Za-z_$][\w$]*)\(\)\.presets\}\)\)\}/,
      `getAllPresets:()=>$1().presets}));globalThis.__tdPresetStore=${binding};globalThis.__tdApplyAppTheme?.()}`,
    );
  }
  return next;
}

export function injectEditorBoot(html: string): string {
  if (!html.includes("</head>")) return html;
  let next = html;
  if (!next.includes("__tdApplyAppTheme")) {
    next = next.replace("</head>", `<script>${EDITOR_BOOT_SCRIPT}</script></head>`);
  }
  // The chunk URLs are content-hashed, so a browser can keep an unpatched copy.
  return next.replace(/(src|href)="(\/_next\/[^"]+)"/g, (_match, attr: string, url: string) => {
    if (url.includes("tdboot=1")) return `${attr}="${url}"`;
    const join = url.includes("?") ? "&" : "?";
    return `${attr}="${url}${join}tdboot=1"`;
  });
}
