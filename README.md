# terras-design-tokens

Shared design tokens (colors, radii, fonts, status chip colors) for Terras apps: `teras-erp`, `terras-crm`, `terras-sku`.

Values mirror the classic (XP) theme from `teras-erp/frontend/app/globals.css` and `xpTheme.tsx` — that repo is the source of truth for design decisions; this package is a mirror kept in sync by hand.

## Usage

Consuming app installs via local path:

```json
{
  "dependencies": {
    "terras-design-tokens": "file:../../terras-design-tokens"
  }
}
```

Import the CSS:

```ts
import 'terras-design-tokens/css'
```

Or read raw values in JS/TS:

```ts
import tokens from 'terras-design-tokens'
tokens.color.statusFamily.blue.chipBg // '#dce4f5'
```

Apply `.ui-style-classic` on the root element to switch from the modern palette to classic.

## Versioning

No build step, no registry — hand-edit `src/tokens.css` + `src/tokens.json` together, bump `version` in `package.json` (semver), commit, tag. Consumers pin via `file:` path and re-`npm install` to pick up changes.
