# terras-ui

Shared design tokens (colors, radii, fonts, status chip colors) and UI components for Terras apps: `teras-erp`, `terras-crm`, `terras-sku`.

Values mirror `teras-erp/frontend/app/globals.css` and `xpTheme.tsx` — that repo is the source of truth for design decisions; this package is a mirror kept in sync by hand. **Classic (XP) is the primary Terras brand** — the one to build new shared components against. `modern` (plain indigo default) and `blueprint` (drafting-blue alt theme, `.ui-style-modern` in teras-erp) exist for parity with that source repo but are secondary.

Published as a private package on **GitHub Packages** (`npm.pkg.github.com`), scoped `@bryanadamg`.

Tokens live in `src/tokens/`; shared components (table shell, modal wrapper, buttons, badges/chips, etc.) go in `src/components/` as they're extracted from the consuming apps.

### Components

Plain `React.createElement` (no JSX) so no build step is required to consume them — `react` is a peerDependency, not bundled. Hand-written `.d.ts` files ship alongside, so TS apps get types without a build.

| Import | What it is |
| --- | --- |
| `components/AppHeader` | Full-bleed blue top band — page name + global actions |
| `components/Sidebar` | Nav rail: brand block, flat items and/or gradient sections, footer — collapses to an icon rail |
| `components/Window` | The bevelled view frame + `.TitleBar` / `.Toolbar` / `.Separator` / `.Body` / `.StatusBar` |
| `components/Modal` | Same chrome one layer up: backdrop, title bar with close box, footer actions. `modeless` drops the backdrop and makes the panel draggable |
| `components/FormSection` | Field group under a solid blue header bar |
| `components/Table` | Ruled classic table (`.EmptyRow` for the empty/loading state, `stickyCols` to freeze leading columns) |
| `components/Pager` | Prev/next paginator footer — the row window on the left, `Prev` / `Page x / y` / `Next` on the right. Is a `Window.StatusBar`; `inline` fits it into one you already render |
| `components/Tabs` | Tab strip seated in the pane below it — renders the row only |
| `components/Button` | Raised bevel button, tones `default` / `primary` / `success` / `danger` |
| `components/Field` | `Input`, `Select`, `Label`, `SearchField` — recessed field chrome |
| `components/Combobox` | Type-to-search single select — trigger with a ▼ well, portaled popup with its own search box |
| `components/Chip` | Status chip over the five shared status families |
| `components/ToggleChip` | Pressed/unpressed chip, tones `blue` / `green` / `red` / `amber` |
| `components/FilterChipBar` | Segmented "pick one (or many) of these" filter row |
| `components/SegmentedBar` | Its stateless sibling — a flush group of plain actions |
| `components/LoginScreen` | The sign-in screen — wordmark, suite panel, two-step form, ID badge (+ `.SuitePanel` / `.IdCard` / `.StatusDot`) |
| `components/BootSplash` | Pre-chrome boot screen + `useBootIndicator`, the two guards that keep it from flashing |
| `styles` | The style primitives the above are built from (`bevel`, `panel`, `titleBar`, `toolbar`, `field`, `button`, `toggleChip`, `cssVar`, `font`, `fs`, `trackingCaps`) — for a one-off surface that has no component yet |

Reach for `Combobox` over a `Select` once a list runs past a hundred or so
options: a native select cannot be typed into, and a native `<datalist>` paints
the browser's own suggestion list rather than classic chrome. Its popup is
portaled to `document.body`, which is what lets it escape a `Modal` body's
`overflow: auto` and stay glued to a modeless panel while it is dragged.

`Table`'s `stickyCols` is Excel's freeze panes: the first N columns hold still
while the rest scroll sideways, for a table wide enough that an operator would
otherwise lose which row they are reading. Give it the columns that identify a
row (a code, a name), not as many as fit — every frozen column is width the
scrolling half no longer has. Offsets are measured from the laid-out cells, so
the frozen columns may be content-sized; a row whose cell spans across the
boundary, such as a `colSpan` group header, stays unfrozen rather than being
pinned wider than the frozen region.

`Pager` is that table's footer, and it *is* a `Window.StatusBar` — the strip is
the same sunken floor, so put it where the status bar would go rather than under
one. Paging state stays with the app (`page` / `total` / `pageSize` /
`onPageChange`, server-side in teras-erp); the component owns only the
arithmetic every hand-rolled pager re-derived — the page count, the `1-25 of 411`
window, and which end disables which button. `hideWhenEmpty` drops the strip
when `total` is 0, and `leftContent` replaces the row window with something else
(a selection count, say). When the bar must also carry the app's own status,
render the bar yourself and pass `inline`:

```jsx
<Window.StatusBar right={<span>{selected.length} selected</span>}>
  <Pager inline page={page} total={total} pageSize={25} onPageChange={setPage} />
</Window.StatusBar>
```

There is no rows-per-page picker, because teras-erp has none — each view fixes
its own `PAGE_SIZE`. `Prev` / `Next` are plain `Button`s so the pager reads as
the same button family as the toolbar above it; `prevLabel` / `nextLabel` take a
node if you want your own icon set in them. Printing is the app's call: pass its
own `no-print` class through `className` — this package ships no print utility
class.

`Chip` and `ToggleChip` are different jobs and keep different faces on purpose: a
`Chip` is a tinted pill that **reports** state over the five status families and
never takes a click; a `ToggleChip` is a control that says **pressed**, over four
tones. Reach for `FilterChipBar` / `SegmentedBar` rather than a hand-spaced row of
`ToggleChip` — they own the flush segment geometry.

`LoginScreen` is the one component here that is **not** classic chrome: sign-in
sits outside the app, so it is a deep blue field in the modern face and looks the
same whichever theme the app boots into (its palette lives in `:root`, as
`--terras-login-*` / `--terras-badge-*`). It is shared because sign-in is the only
screen where all three apps show the *same* thing — the wordmark and the suite
panel are suite identity, and `SUITE_MODULES` is one list of what Terras is.

It owns the flow; the app owns auth. Everything two-step — the fields, the slide
direction, focus handoff, the badge opening, the clock, the error line — is UI and
lives in the component. `onSubmit` performs the sign-in and returns `true` or the
message to show. Anything device-local stays with the app: the remembered username
you seed `initialUsername` with, the cached name/role you answer `identityFor`
with, and where a signed-in user goes next. This package has no router, no fetch
and no storage keys, and a login screen is not the thing to give it any.

```jsx
<LoginScreen
  module="SKU"                       // "Terras" is the suite; this is the module
  activeModules={['pim']}
  suiteIcons={{ pim: <i className="bi bi-tags-fill" /> }}
  initialUsername={remembered}       // read from storage BEFORE this mounts
  identityFor={recallIdentity}       // device-cached {fullName, role}, never a lookup
  avatar={({ username, size }) => <PixelAvatar seed={username} size={size} />}
  onUsernameConfirmed={u => localStorage.setItem('terras_last_username', u)}
  onSubmit={async (u, p) => (await login(u, p)) === true || 'Invalid username or password'}
  status={health} version={version} docsHref="/docs"
/>
```

An app that signs in by address rather than username passes
`identityType="email"` — same flow, and only the label, the input `type` /
`autocomplete`, the hint copy and the fallback error message move with it. The
rest of the API keeps saying "username" for whatever the operator types first,
so there is one vocabulary rather than two parallel sets of props.

`avatar` is a **slot** on purpose: the apps draw faces with `@dicebear/*`, and this
package carries no runtime dependency but react. Render at the `size` you are
handed and don't re-size it when the badge opens — the card animates one
persistent set of nodes precisely so the face never pops, and nothing can
transition across an unmount. `identityFor` must be synchronous and device-local:
a pre-auth lookup would confirm to anyone that a given account exists, so an
unknown username still gets a card, reading "Role confirmed at sign-in".

`SuitePanel` takes `icons` as a `{ key: node }` map because this package ships no
icon set; a module with no icon falls back to its `short` acronym rather than an
empty tile. `IdCard` is exported on its own for the Sidebar footer — it is the same
object in both places, and omitting `open` there gives you the always-open card.

`BootSplash` covers the gap before there is any chrome to draw — hydration plus the
session round-trip. Gate it on `useBootIndicator`, which holds the two guards that
keep it from flashing: nothing shows for the first 250ms (a warm start with no
stored token finishes in a few ms, and a splash flashed across it makes the app
feel slower than silence), and once shown it stays at least 400ms. Render
**nothing** in the window where the hook is false but boot is still running.

```jsx
const booting = !mounted || loading
const showBoot = useBootIndicator(booting)
if (showBoot) return <BootSplash phase={mounted ? bootPhase : 'hydrating'} />
if (booting) return null
```

If your app scales its whole UI (teras-erp divides a `--ui-zoom` factor back out
into `--app-vh` / `--app-vw`), point the two tokens `--terras-app-vh` /
`--terras-app-vw` at yours — `LoginScreen` sizes itself against those, and they
default to the real viewport units.

A page assembled from them:

```jsx
import Window from '@bryanadamg/terras-ui/components/Window'

<Window fill="page">
  <Window.TitleBar title="Movements" right={`${total} lines`} />
  <Window.Toolbar>{/* SearchField, Selects, actions */}</Window.Toolbar>
  <Window.Body><Table>{/* … */}</Table></Window.Body>
  <Pager page={page} total={total} pageSize={25} onPageChange={setPage} />
</Window>
```

`Sidebar` only owns layout + the classic-theme palette (`--terras-sidebar-*` tokens) — routing/active-match stays with the consuming app (works the same under Next.js or react-router).

Collapsing splits the same way: this package owns what the icon rail looks like,
the app owns whether it is collapsed. Pass `collapsed` (controlled, like an item's
`active`) and `onToggleCollapsed` to get the built-in chevron in the brand band;
omit the handler and no toggle chrome renders, for an app that would rather drive
the state from its own `AppHeader` action. Persisting the choice is the app's job —
under Next.js, seeding it from `localStorage` during render is a hydration mismatch,
and each app settles that its own way.

```jsx
const [collapsed, setCollapsed] = useState(false)

<Sidebar
  appName="Terras ERP"
  collapsed={collapsed}
  onToggleCollapsed={() => setCollapsed(c => !c)}
  sections={sections}
  footer={({ collapsed }) => (collapsed ? <Avatar /> : <IdCard user={user} />)}
/>
```

At rail width labels drop to a native `title` tooltip, a `sub` row keeps its
`--terras-sidebar-sub-bg` tint in place of its indent, and a section band shrinks to
its `icon` — or to a bare 6px gradient stripe when it has none, so two unrelated
groups of glyphs never run together. `section.right` is dropped rather than shrunk.
**Give every section an `icon`** unless you want that stripe. `top` and `footer` each
accept a `({ collapsed }) => node` function for content that can't survive 44px.

**Both stylesheets are required.** `terras-ui/css` is the custom properties; `terras-ui/chrome` carries the rules an inline style object cannot express (`:hover` / `:focus` / `::placeholder`, scrollbars, and the table `th`/`td` descendant selectors). Without the second one, buttons lose their press motion and tables render unruled.

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
    "@bryanadamg/terras-ui": "^0.7.0"
  }
}
```

4. Import both stylesheets, tokens first:

```ts
import '@bryanadamg/terras-ui/css'     // custom properties
import '@bryanadamg/terras-ui/chrome'  // :hover / :focus / table / scrollbar rules
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
