# Brand assets

The Terras mark, shared so every app renders the identical logo. Source of truth
is `terras-erp/frontend/app/icon.svg` + `terras-erp/frontend/public/icons/*` —
these are copies, same hand-sync rule as the tokens.

| File | What it's for |
| --- | --- |
| `terras-mark.svg` | Vector source. Use this anywhere a bundler resolves the URL — sidebar brand block, headers, login. |
| `icon-192.png` | PWA manifest / apple-touch-icon |
| `icon-512.png` | PWA manifest |
| `icon-512-maskable.png` | PWA maskable (Android adaptive) |

The mark's gradient is `#0058e6 → #08a5ff` — the same ramp as
`--terras-title-blue`. It is a fixed two-colour logo, not a `currentColor`
glyph: don't recolour it per theme, and don't add a monochrome variant without
a real need for one.

## Using them

Import the URL and let the bundler emit the asset:

```ts
import markUrl from '@bryanadamg/terras-ui/assets/terras-mark.svg'

<Sidebar brandIcon={<img src={markUrl} width={16} height={16} alt="" />} … />
```

**Not** re-exported as a React component on purpose. An inline `<svg>` would
need its `<defs>` ids uniquified per instance (they collide when the mark
renders twice on a page), and this package has no build step to do that. A URL
import costs one request and has none of those problems.

The PNGs exist for a web-app manifest, which needs real files at stable public
URLs — a hashed bundler asset won't do. An app that ships a manifest should copy
them into its own `public/` at build time (a prebuild script or
`vite-plugin-static-copy`) rather than committing a second copy by hand.

## What is NOT here

**Third-party icon sets** — `lucide-react`, `bootstrap-icons`, etc. Those stay a
dependency of each app. Every component in this package takes `icon` as a plain
`ReactNode` and has no icon-set opinion, so an app can use whichever set it
already has; vendoring one here would pin its version for all three apps, double
the bundle when an app uses a different set, and break tree-shaking.

**Tenant logos** — `terras-erp/backend/static/logos/` is user-uploaded content
served by the API, not brand chrome. It does not belong in a design package.
