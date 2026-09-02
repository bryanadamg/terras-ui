# terras-ui

Shared design tokens (colors, radii, fonts, status chip colors) and UI components for Terras apps: `teras-erp`, `terras-crm`, `terras-sku`.

Values mirror `teras-erp/frontend/app/globals.css` and `xpTheme.tsx` — that repo is the source of truth for design decisions; this package is a mirror kept in sync by hand. **Classic (XP) is the primary Terras brand** — the one to build new shared components against. `modern` (plain indigo default) and `blueprint` (drafting-blue alt theme, `.ui-style-modern` in teras-erp) exist for parity with that source repo but are secondary.

Published as a private package on **GitHub Packages** (`npm.pkg.github.com`), scoped `@bryanadamg`.

Tokens live in `src/tokens/`; shared components (table shell, modal wrapper, buttons, badges/chips, etc.) go in `src/components/` as they're extracted from the consuming apps.

### Components

Plain `React.createElement` (no JSX) so no build step is required to consume them — `react` is a peerDependency, not bundled.

```jsx
import Sidebar from '@bryanadamg/terras-ui/components/Sidebar'

<Sidebar
  appName="Terras SKU"
  items={NAV_ITEMS.map(i => ({ key: i.to, label: i.label, icon: <i.icon size={16} />, active: pathname === i.to, onClick: () => navigate(i.to) }))}
  footer={<UserFooter />}
/>
```

`Sidebar` only owns layout + the classic-theme palette (`--terras-sidebar-*` tokens) — routing/active-match stays with the consuming app (works the same under Next.js or react-router).

## Usage (consuming app)

1. Add a scoped registry mapping + auth token in the consuming app's `.npmrc` (repo root, next to its `package.json` — commit this file, it has no secret in it):

```
@bryanadamg:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

2. Set `NODE_AUTH_TOKEN` in the environment that runs `npm install` — local shell, CI secret, or Docker build arg. Token needs a GitHub PAT (classic) with `read:packages` + `repo` (private repo) scopes.

3. Add the dependency:

```json
{
  "dependencies": {
    "@bryanadamg/terras-ui": "^0.2.0"
  }
}
```

4. Import the CSS:

```ts
import '@bryanadamg/terras-ui/css'
```

Or read raw values in JS/TS:

```ts
import tokens from '@bryanadamg/terras-ui'
tokens.color.statusFamily.blue.chipBg // '#dce4f5'
```

Apply `.ui-style-classic` on the root element for the classic (XP) brand palette, or `.ui-style-blueprint` for the alternate drafting-blue theme. Neither applied = plain `modern` indigo default.

## Publishing (this repo)

No build step — hand-edit `src/tokens/tokens.css` + `src/tokens/tokens.json` together, bump `version` in `package.json` (semver), commit, tag, then:

```bash
NODE_AUTH_TOKEN=<PAT with write:packages,repo> npm publish
```

PAT needs `write:packages` + `repo` (private repo) scopes to publish.
