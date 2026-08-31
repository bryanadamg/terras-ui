# terras-design-tokens

Shared design tokens (colors, radii, fonts, status chip colors) for Terras apps: `teras-erp`, `terras-crm`, `terras-sku`.

Values mirror the classic (XP) theme from `teras-erp/frontend/app/globals.css` and `xpTheme.tsx` — that repo is the source of truth for design decisions; this package is a mirror kept in sync by hand.

Published as a private package on **GitHub Packages** (`npm.pkg.github.com`), scoped `@bryanadamg`.

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
    "@bryanadamg/terras-design-tokens": "^0.1.0"
  }
}
```

4. Import the CSS:

```ts
import '@bryanadamg/terras-design-tokens/css'
```

Or read raw values in JS/TS:

```ts
import tokens from '@bryanadamg/terras-design-tokens'
tokens.color.statusFamily.blue.chipBg // '#dce4f5'
```

Apply `.ui-style-classic` on the root element to switch from the modern palette to classic.

## Publishing (this repo)

No build step — hand-edit `src/tokens.css` + `src/tokens.json` together, bump `version` in `package.json` (semver), commit, tag, then:

```bash
NODE_AUTH_TOKEN=<PAT with write:packages,repo> npm publish
```

PAT needs `write:packages` + `repo` (private repo) scopes to publish.
