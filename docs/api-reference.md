# API reference

## Entry point `@tweakcn/devtools`

### `TweakcnDevtools(options?)`

React component. Renders a bottom dock in a shadow root so host page styles do not affect the panel chrome.

### `initTweakcnDevtools(options?)`

Imperative mount. Appends a host element to `document.documentElement`, mounts the panel, and returns `destroyTweakcnDevtools`. Safe to call once; repeated calls return the destroy function without mounting again.

### `destroyTweakcnDevtools()`

Unmounts and removes the host element from the document.

### Re-exports

| Export | Description |
| --- | --- |
| `applyThemeStyles(entry, mode)` | Applies CSS variables, `.dark`, fonts, and shadow overrides on `document.documentElement` |
| `captureRootThemeSnapshot()` | Saves `className` and inline `style` on the root element |
| `restoreThemeSnapshot(snapshot)` | Restores the root element from a snapshot |

### `TweakcnDevtoolsOptions`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `initialIsOpen` | `boolean` | `false` | Whether the dock starts expanded |
| `defaultMode` | `"light"` \| `"dark"` | `"light"` | Mode applied when you pick a theme |
| `communityUrl` | `string` | `"/__tweakcn/community"` | POST endpoint that returns `{ themes, nextCursor }` JSON |
| `disableCommunity` | `boolean` | `false` | Hides the Community tab; presets and bundled snapshot only |
| `zIndex` | `number` | `2147483646` | Stacking order of the dock host |

### Types

`ThemeCatalogEntry`, `ThemeStyles`, `ThemeMode`, `CommunityPage`, and `TweakcnDevtoolsOptions` are exported as types.

## Entry point `@tweakcn/devtools/vite`

### `tweakcnDevtools(options?)`

Vite plugin (dev server only). Registers middleware on `communityPath` that forwards to tweakcn and returns parsed JSON.

### `TweakcnDevtoolsViteOptions`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `communityPath` | `string` | `"/__tweakcn/community"` | URL prefix handled by the middleware |

POST body from the client: `{ "cursor": null \| string \| number }`. Response: `{ "themes": ThemeCatalogEntry[], "nextCursor": string \| number \| null }`.

## Build output

`bun run build` writes `dist/index.js`, `dist/vite.js`, and declaration files. The browser bundle includes bundled JSON under `src/data/` (~2.3 MB minified as of 0.1.0).
