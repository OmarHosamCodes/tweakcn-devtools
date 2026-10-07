# Legal and bundled theme data

This page is reference only. It describes what the license covers and what it does not.

## Package source code

The TypeScript and JavaScript in this repository (everything under `src/`, `scripts/`, and `playground/` except bundled JSON) is licensed under the [MIT License](../LICENSE).

## Bundled theme data

The files `src/data/predefined-registry.json` and `src/data/community-snapshot.json` are **not** original works of this package. They are snapshots copied from public [tweakcn.com](https://tweakcn.com) endpoints for local preview in development tools.

| File | Source | Role in this package |
| --- | --- | --- |
| `predefined-registry.json` | `https://tweakcn.com/r/registry.json` | Preset theme definitions (36 themes at last sync) |
| `community-snapshot.json` | tweakcn community API via `bun run sync` | Offline list of community themes (500 themes at last sync) |

Each community theme may list an author name in the JSON. Those authors and tweakcn retain any rights they have in the underlying theme designs and data.

This package:

- Does **not** claim ownership of tweakcn, the tweakcn name, or community theme content.
- Is **not** affiliated with, endorsed by, or sponsored by tweakcn.
- Bundles theme data **only** so you can preview CSS variable themes on your own app during development.
- Does **not** grant you a license to redistribute theme data separately from this tool. If you ship a product that embeds or republishes theme JSON, confirm terms with tweakcn and the theme authors.

To refresh snapshots from tweakcn, run `bun run sync` from the repository root. That command writes new JSON into `src/data/` and does not change the MIT license on the package code.

## Live community loading

In development, the Vite plugin proxies requests to tweakcn so your browser can load more community pages. That traffic goes to tweakcn’s servers and is subject to tweakcn’s terms and availability. The proxy uses a Next.js server action id baked into `src/flight.ts`. A tweakcn deploy can break live loading until the id is updated; bundled presets and the snapshot still work offline.

## Trademarks

“tweakcn” and related marks belong to their respective owners. This project is an independent developer tool for previewing shadcn-compatible CSS themes.
