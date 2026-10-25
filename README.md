# @tweakcn/devtools

Preview [tweakcn](https://tweakcn.com) shadcn themes on your running app. The panel works like TanStack Query Devtools: a bottom dock you open while you develop.

**License:** MIT for this package’s code. Bundled theme JSON comes from tweakcn and community authors; see [Legal and bundled theme data](docs/legal-and-data.md).

## What you need on the host page

Your app must already use shadcn-style CSS variables on `:root` (the same variables tweakcn themes expect). The devtools only swap values and toggle `.dark`; they do not install a design system for you.

## Install

```bash
bun add @tweakcn/devtools
# or
npm install @tweakcn/devtools
```

Until the package is on npm, install from Git:

```bash
npm install github:OmarHosamCodes/tweakcn-devtools
```

Run `npm run build` in the cloned repo before linking locally.

## Add the panel (Vite)

1. Register the community proxy in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tweakcnDevtools } from "@tweakcn/devtools/vite";

export default defineConfig({
  plugins: [react(), tweakcnDevtools()],
});
```

2. Mount the devtools in your app (development only):

```tsx
import { TweakcnDevtools } from "@tweakcn/devtools";

export function App() {
  return (
    <>
      {/* your app */}
      {import.meta.env.DEV ? <TweakcnDevtools /> : null}
    </>
  );
}
```

Or mount without React in your entry file:

```ts
import { initTweakcnDevtools } from "@tweakcn/devtools";

if (import.meta.env.DEV) {
  initTweakcnDevtools();
}
```

Open the dock, pick **Presets** or **Community**, and click a theme. **Restore original theme** puts your page back the way it was before the first apply.

**Extend** opens the real [tweakcn](https://tweakcn.com) editor. Its controls stay on the side. The preview section is this page itself, fitted into that area, not a second copy loaded from a URL. Change a color in tweakcn and this page updates. **Dock** returns to the bottom sheet and lets the page use the full window again.

## Community themes in dev

Browsers cannot call tweakcn’s server actions from your localhost origin. The Vite plugin exposes `POST /__tweakcn/community` and forwards to tweakcn on the server.

- The **Community** tab ships with **500** bundled themes from `src/data/community-snapshot.json`.
- **Load more** uses the proxy and tweakcn’s live API when the proxy works.

If live loading fails after a tweakcn deploy, update the action id in `src/flight.ts` or rely on presets and the bundled snapshot. Details are in [Legal and bundled theme data](docs/legal-and-data.md).

## Without Vite

Use presets and the bundled community list only:

```tsx
<TweakcnDevtools disableCommunity />
```

To paginate community themes, implement your own POST handler that returns `{ themes, nextCursor }` and pass `communityUrl`.

## Options and exports

See [API reference](docs/api-reference.md) for `TweakcnDevtoolsOptions`, theme helpers, and the Vite plugin.

## Try the playground

```bash
git clone https://github.com/OmarHosamCodes/tweakcn-devtools.git
cd tweakcn-devtools
bun install
bun run dev
```

Vite serves the playground on an open port (often `5173` or `5174`).

## Refresh theme snapshots

Maintainers can pull the latest registry and community pages from tweakcn:

```bash
bun run sync
```

That overwrites `src/data/predefined-registry.json` (36 presets at last sync) and `src/data/community-snapshot.json` (500 community themes at last sync). Commit the JSON if you want the npm bundle to match.

## Build and publish

```bash
bun run typecheck
bun run build
```

The browser bundle is large (~2 MB) because it embeds theme JSON. `package.json` `"files"` publishes only `dist/` plus license files for npm.

## Affiliation

Independent project. Not affiliated with tweakcn. Theme names and data belong to tweakcn and respective authors.
