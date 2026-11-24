# terras-ui

Shared design tokens (colors, radii, fonts, status chip colors) and UI components for Terras apps: `terras-erp`, `terras-crm`, `terras-sku`.

Values mirror `terras-erp/frontend/app/globals.css` and `xpTheme.tsx` — that repo is the source of truth for design decisions; this package is a mirror kept in sync by hand. **Classic (XP) is the primary Terras brand** — the one to build new shared components against. `modern` (plain indigo default) and `blueprint` (drafting-blue alt theme, `.ui-style-modern` in terras-erp) exist for parity with that source repo but are secondary.

The repo is public: apps install it straight from its git tags with no token (terras-erp does). It is also published to **GitHub Packages** (`npm.pkg.github.com`, scoped `@bryanadamg`), which needs a token to install — terras-crm and terras-sku still use that route.

Tokens live in `src/tokens/`; shared components (table shell, modal wrapper, buttons, badges/chips, etc.) go in `src/components/` as they're extracted from the consuming apps.

### Components

Plain `React.createElement` (no JSX) so no build step is required to consume them — `react` is a peerDependency, not bundled. Hand-written `.d.ts` files ship alongside, so TS apps get types without a build.

| Import | What it is |
| --- | --- |
| `components/AppHeader` | Full-bleed blue top band — page name + global actions |
| `components/Sidebar` | Nav rail: brand block, flat items and/or gradient sections, footer — collapses to an icon rail |
| `components/Window` | The view frame — under classic a card like `Modal` (one 1px edge, soft lift) around Porcelain list chrome (flat warm toolbar, body and status bar); the 2px bevel elsewhere — + `.TitleBar` / `.Toolbar` / `.Separator` / `.Count` / `.Body` / `.StatusBar` |
| `components/Modal` | The page's chrome one layer up — under classic, `Window`'s flat accent title bar framed like the page card (one 1px edge, soft shadow) on the Sapphire Frost near-white: backdrop, title bar with close box, footer actions. `modeless` drops the backdrop and makes the panel draggable |
| `components/ConfirmModal` | Confirm/cancel dialog — a `Modal` + `Button` composition, `tone` picks the confirm button (`warning` maps to the plain face) |
| `components/FormSection` | Field group under a solid header bar — the accent under classic, matching the sidebar's section bands |
| `components/Table` | Ruled classic table (`.EmptyRow` for the empty state — with an optional `icon` slot, `stickyCols` to freeze leading columns, `.SortableTh` + `useSortable` / `useServerSort` for sortable headers, `useRowSelection` + `.SelectAllCell` / `.RowCheckboxCell` for bulk-select, `.ExpanderCell` + `.ExpandedRowPanel` + `rowStateBg` for rows that open a detail panel) |
| `components/Skeleton` | Loading stand-ins that carry the shape of what's coming — `TableSkeleton` rows (+ `useTableSkeletonMetrics`), `ListSkeleton`, `PanelSkeleton`, `CardGridSkeleton`, `TableBlockSkeleton`, and the `Loading` marquee for a wait with no shape |
| `components/DetailGrid` | Read-only record fields as a `<dl>` — `.Detail` cells, stacked across `columns` or `inline` (label left, value right); empty values hold their place with a muted — |
| `components/EmptyState` | "Nothing here" for a pane that isn't a table body — recessed well, optional glyph slot, italic message, room for an action under it |
| `components/Pager` | Prev/next paginator footer — the row window on the left, `Prev` / `Page x / y` / `Next` on the right. Is a `Window.StatusBar`; `inline` fits it into one you already render |
| `components/Tabs` | Tab strip seated in the pane below it — renders the row only. Under classic, inactive tabs are bare labels and the active tab carries a 2px accent cap |
| `components/ProgressBar` | Recessed progress track — up to three stacked segments, a threshold marker, `outside`/`inside` percent label |
| `components/Sparkline` | Inline-SVG trend line coloured by status family, dot on the latest point. No stat tile beside it — see below |
| `components/Toast` | `ToastProvider` + `useToast` — transient feedback stack, bottom-right, with a progress-toast handle for long jobs |
| `components/Tooltip` | Styled hover bubble for one element (no wrapper), `GlobalTooltip` to park native `title`s app-wide and echo clipped text, and the `FloatingLayer` / `useHoverAnchor` base any popout sits on |
| `components/Button` | Raised bevel button, tones `default` / `primary` / `success` / `danger` |
| `components/ActionButton` | Compact flat button for a table's action column — five tones incl. `warning`, icon slot, `title` as a styled tooltip |
| `components/Menu` | Row "⋯" menu — `useFloatingMenu` (one open per table), `FloatingMenu`, `MenuTriggerButton` |
| `components/WindowCloseButton` | The title bar's close box — grey at rest, red on hover. `Modal` renders it; use it directly in any window title bar you paint yourself |
| `components/FeedbackDialog` | The in-app feedback form (one message box, pasted or attached screenshots with a black-out editor, opt-in name) — anonymous by default; the app owns the trigger button and `onSubmit` |
| `components/HeaderButton` | Ghost controls for the app header band — `HeaderButton` (default) and `HeaderSelect`: transparent, white, a faint white edge; hover washes white. For scan/feedback/search buttons and the language picker in `AppHeader`'s `right` slot. `LogoutButton` stays the one flat red action |
| `components/LogoutButton` | The header's logout control — erp's flat red, deliberately not the `danger` tone (see below) |
| `components/MobileShell` | The phone shell (+ `useIsMobile`, `(max-width: 767px)`, false on the server): `header` slot, scrolling page, a tab bar in the sidebar palette (`tabs: { key, label, icon?, active?, onClick }[]`), and an optional full-menu sheet (`menu` sections, controlled `menuOpen`/`onMenuOpenChange`). With `menu`, a trailing menu tab is lit while open or when no tab is active; the page stays mounted under the sheet. Routing, icons and header contents stay in the app |
| `components/Field` | `Input`, `Select`, `Label`, `SearchField` — recessed field chrome; `FieldLabel` (bold form label + optional hint) and `FormError` (the submit-rejected banner) |
| `components/Combobox` | Type-to-search single select — trigger with a ▼ well, portaled popup with its own search box |
| `components/Chip` | Status chip over the five shared status families |
| `components/ToggleChip` | Pressed/unpressed chip, tones `blue` / `green` / `red` / `amber` |
| `components/FilterChipBar` | Segmented "pick one (or many) of these" filter row |
| `components/SegmentedBar` | Its stateless sibling — a flush group of plain actions |
| `components/LoginScreen` | The sign-in screen — wordmark, suite panel, two-step form, ID badge (+ `.SuitePanel` / `.IdCard` / `.StatusDot`) |
| `components/BootSplash` | Pre-chrome boot screen + `useBootIndicator`, the two guards that keep it from flashing |
| `components/AppLoadBar` | Determinate strip for a boot-time data load — takes `done` / `total`, the counting stays app-side |
| `components/AccessDenied` | Panel swapped in for a route's content when the user lacks its permission — the shell stays around it, `onBack` is a callback, not a router |
| `components/CityMatrix` | The dot-matrix city behind the sign-in field — a canvas of blinking dots over a generated grid |
| `types` | Type-only: the shared prop vocabularies (`ShellTone`, `ButtonTone`, `ChipFamily`, `ToggleTone`, …) — `import type { ShellTone } from '@bryanadamg/terras-ui/types'` instead of restating the words locally |
| `styles` | The style primitives the above are built from (`bevel`, `panel`, `recessed`, `titleBar`, `toolbar`, `field`, `button`, `toggleChip`, `cssVar`, `font`, `fs`, `trackingCaps`) — for a one-off surface that has no component yet |

A number field in a dense grid row takes `className="terras-nospin"` to drop the
native spinner, which otherwise eats a third of a 46px box. It's opt-in per
input: in a standalone form field the spinner has room and is worth keeping.

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

Sorting is a header cell plus a hook, and the hook decides where the sort
happens. `useSortable(rows, { code: r => r.code, qty: r => r.qty })` reorders in
memory and is only correct when the view holds the **whole** set; a paged list
the server sorts takes `useServerSort()` and feeds `sort` into its query instead
— sorting one page client-side puts the wrong rows on page 1. Both cycle
asc → desc → off (`nextSortState`, exported for a sort kept in a URL param), and
empty values sort last either way. `Table.SortableTh` owns the pointer, the
`aria-sort`, the ▲/▼ mark and `userSelect: none`; a null `colKey` renders a
plain header, so a config-driven column list keeps one call per column:

```jsx
const { sorted, sort, toggle } = useSortable(rows, { code: r => r.code, qty: r => r.qty })

<Table.SortableTh sort={sort} colKey="code" onSort={toggle}>Code</Table.SortableTh>
```

Bulk selection keeps the **row objects**, keyed, so the selection survives
paging and a bulk action never has to look a row up in a page that is no longer
on screen. The header checkbox is page-scoped on purpose — it adds or clears the
eligible rows you can see, and rows ticked on other pages stay ticked — and it
owns the indeterminate state, which is a DOM property with no attribute form.
`selectable` excludes rows that can't take the action. A row checkbox stops its
click from reaching the row, so a clickable row doesn't also open. The checkbox
column comes first, before any expander:

```jsx
const sel = useRowSelection(rows, r => r.id, { selectable: r => r.status !== 'LOCKED' })

<tr><Table.SelectAllCell allSelected={sel.allPageSelected} someSelected={sel.someSelected} onChange={sel.togglePage} />…</tr>
<tr><Table.RowCheckboxCell checked={sel.isSelected(row)} onChange={() => sel.toggle(row)} label={row.code} />…</tr>
```

Load a table with `TableSkeleton` rows, not a "Loading..." row: the bars sit in
the table's own columns and ruling, so nothing jumps when the data lands. Feed it
from `useTableSkeletonMetrics`, which counts the columns off the live `<thead>`
(a hand-counted `cols` goes stale the day someone adds one), remembers the real
row height once it has seen a row, and fills the scroll box's free height. Show
the skeleton while the first fetch is in flight and `Table.EmptyRow` once it has
resolved empty. The bars stay invisible for 250ms (chrome.css), so a fast
response never flashes grey:

```jsx
const bodyRef = useRef(null)
const skel = useTableSkeletonMetrics('sales-orders', bodyRef, rows.length > 0)

<tbody ref={bodyRef}>
  {rows.length === 0 && (loading
    ? <TableSkeleton cols={skel.cols ?? 8} rowHeight={skel.rowHeight} fillHeight={skel.fillHeight} />
    : <Table.EmptyRow colSpan={8}>No orders</Table.EmptyRow>)}
```

A ruled `.terras-table` takes the skeleton as is. A zebra-striped table passes its
second-row ground as `stripe` (`TableBlockSkeleton` takes the same prop), or the
rows change colour when the data lands.

The measured row height is cached in memory only; erp also keeps it in
`sessionStorage`, but storage keys belong to the app, so a reload's first paint
uses a 26px estimate. `Loading` is for a wait with no shape to promise (a scan
resolving to one of several screens) — anywhere else, a skeleton.

A row that opens a detail panel takes its **own** chevron column, second after
any checkbox and before the first data column, never inside a data cell. The
chevron points right and turns down when open. The panel goes in a flush
full-width cell below the row, and the row takes the `expanded` ground:

```jsx
<tr style={{ background: open ? rowStateBg('expanded') : undefined }} onClick={toggle}>
  <Table.ExpanderCell expanded={open} onToggle={toggle} label="lot lineage" panelId={`lin-${row.id}`} />
  <td>{row.code}</td>…
</tr>
{open && (
  <tr><td colSpan={cols} className="terras-cell-flush">
    <Table.ExpandedRowPanel id={`lin-${row.id}`}><Table.ExpandedRowPanelBody>…</Table.ExpandedRowPanelBody></Table.ExpandedRowPanel>
  </td></tr>
)}
```

The three row grounds mean three different things and shouldn't be swapped:
`expanded` (light blue, panel open), `selected` (a darker blue, ticked for a
bulk action) and `highlighted` (amber, a scroll target or search hit). The
panel's rail and rules are inset shadows, not borders. A border inside the
spanning cell would widen it and shift every column above on expand.

`Pager` is that table's footer, and it *is* a `Window.StatusBar` — the strip is
the same sunken floor, so put it where the status bar would go rather than under
one. Paging state stays with the app (`page` / `total` / `pageSize` /
`onPageChange`, server-side in terras-erp); the component owns only the
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

There is no rows-per-page picker, because terras-erp has none — each view fixes
its own `PAGE_SIZE`. `Prev` / `Next` are plain `Button`s so the pager reads as
the same button family as the toolbar above it; `prevLabel` / `nextLabel` take a
node if you want your own icon set in them. Printing is the app's call: pass its
own `no-print` class through `className` — this package ships no print utility
class.

`Toast` is the channel between an inline error (which belongs in the form that
caused it) and a `Modal` (which demands an answer). Wrap the app once, then call
it by name:

```jsx
<ToastProvider icons={{ green: <Check size={12} />, red: <XCircle size={12} /> }}>
  <App />
</ToastProvider>

const toast = useToast()
toast.success('Pick sheet saved')
toast.error('Server rejected the move')

// One toast for a long job, mutated in place rather than one per unit of work.
const job = toast.progress('Rebuilding BOMs', '1 of 7')
job.update(43, '3 of 7 · WIP CBG 9698/22')
job.finish('Rebuilt 7 BOMs')
```

Tones are the colour words (`green` / `red` / `amber` / `blue`, the same four as
`ToggleChip`); the named methods carry the semantics, so the package keeps one
tone vocabulary. An error is read rather than glanced at, so it holds ~7s against
a success's 4s and is the only tone that takes `role="alert"` — the rest wait
their turn on a screen reader as they do visually. Four are visible at once and
the oldest drops past that, **except** a running progress toast, which is sticky
until it finishes or fails. Icons are a slot: erp draws them with bootstrap-icons
and sku with lucide, so an unset tone falls back to a text mark rather than a
bundled SVG set. Not for anything the user must act on — a toast that asks a
question is a `Modal` wearing the wrong chrome.

`ProgressBar`'s tooltip is a **slot**, not a dependency. terras-erp wraps the
track and the threshold marker in its own `Tooltip` — ~300 lines over a portal
layer, a theme context and the clipped-chip popout, none of which this package
ships. Pass `tooltip={(node, content) => <YourTip content={content}>{node}</YourTip>}`
to use your own; the default puts `content` in a native `title=` attribute. Leave
`tone` unset and the bar reads the number (>=100 green, >0 amber, else gray); set
it when the bar means something other than completion, like blue for "in progress"
or red for a shortfall. `secondaryPct` / `tertiaryPct` stack after the primary fill
and are each clamped against what the earlier segments already took, so three
optimistic numbers can't overflow the track.

`Tooltip` wraps **one** element and clones hover/focus handlers onto it — no
wrapper node, so a `<th>` or a flex child keeps its layout. It is for text
someone asked for: the dwell is 900ms, close to the native delay, so it doesn't
fire on the mouse merely crossing a dense table. Icon-only buttons in an action
column want `placement="side"`, since below them is the next row's button.

```jsx
<Tooltip content="Steps completed on the MOs behind this line"><th>MO Progress</th></Tooltip>
```

`GlobalTooltip` is opt-in and app-wide, so mount it once near the root. It
moves every `title` onto `data-original-title` as it appears (mirroring it to
`aria-label` when the element has no other name) so the OS never draws its grey
box, and it echoes single-line text that is clipped by its column after a short
260ms dwell. A plain `title` no longer opens anything once it's mounted — that is
the point. Anything inside `[data-no-tip]` is left alone, and so are `<option>`,
`<select>` and `<iframe>`. Components here that fall back to a native `title`
(`ProgressBar`'s default tooltip, a collapsed `Sidebar`'s labels) go quiet under
it, so pass them a `Tooltip` where the text matters.

Every layer is a `document.body` portal on the tooltip z-layer (above modals),
placed in layout px through `terras-ui/scale` and corrected against where it
actually landed. `FloatingLayer` + `useHoverAnchor` are exported for any other
popout; pass `interactive` to a layer that takes clicks.

An action column is `ActionButton`s plus a `MenuTriggerButton` for the
overflow. `ActionButton` is flat on purpose — a raised bevel reads as chunky at
20px — and so it is a different component from `Button`, not a size of it. Its
`warning` tone exists because erp's action columns use it; the other four share
their words with `Button`. One menu is open per table, keyed by row id:

```jsx
const menu = useFloatingMenu()

<td>
  <ActionButton tone="primary" icon={<Printer size={11} />} title="Print" onClick={() => print(row)} />
  <MenuTriggerButton onClick={e => menu.toggle(row.id, e)} expanded={menu.isOpen(row.id)} />
</td>

{menu.openId && <FloatingMenu menu={menu} items={[
  { key: 'edit', label: 'Edit', onClick: () => edit(menu.openId) },
  { key: 'del', label: 'Delete', danger: true, hidden: !canDelete, onClick: () => remove(menu.openId) },
]} />}
```

The menu is a portal right-aligned under its trigger, on the overlay layer so it
clears a modal. An item click runs the item and then closes the menu. Outside
click, scroll, resize and Escape close it too. erp decided "outside" with a
`.xp-menu-trigger` class the caller had to add; here any button that calls
`toggle` counts as the trigger.

`Sparkline` takes the status-family words (`family="amber"`), not a hex, so a
trend reads the same as the chip beside it. The KPI tile around it is **not**
shared. A tile's big figure needs a display font size, `tokens.css` has
deliberately no display tier, and erp itself paints the same kind of tile at
20px and 26px. Paint the tile in the app, from `panel()`.

A form's rejection is `FormError` at the top of the body — `role="alert"`, and
it renders nothing when the message is empty, so `<FormError>{error}</FormError>`
needs no guard. It is not a status callout and not a toast. `FieldLabel` is the
form label, bold where `Label` is plain. Its `hint` is a visible line, so give it
only the rule a reader needs every time; the one-time *why* goes in `title`.

`Chip` and `ToggleChip` are different jobs and keep different faces on purpose: a
`Chip` is a tinted pill that **reports** state over the five status families and
never takes a click; a `ToggleChip` is a control that says **pressed**, over four
tones. Reach for `FilterChipBar` / `SegmentedBar` rather than a hand-spaced row of
`ToggleChip` — they own the flush segment geometry. `Chip` is erp's status chip,
9px bold over `1px 6px`; `solid` takes erp's filled faces (`--terras-chip-*-solid-*`),
where amber deepens to carry white text and gray turns light with dark text.

`LogoutButton` is flat red (`#ff4d4d`, one `#800000` border) where `Button`'s
`danger` tone is the XP gradient over a two-tone bevel. That is not drift — it is
where the control lives. A destructive button inside a window wears the bevel;
logout sits in the title band, which is flat chrome, and terras-erp paints it flat
there. Don't unify them by flattening `--terras-btn-danger-face`: that would drag
every modal's Delete in all three apps off `xpTheme.tsx` to settle one header
control. It defaults `title` and `data-testid` — erp and sku already hand-typed
both identically, and the third app shouldn't get to invent its own wording. The
icon is a slot and the label is `children`, so an app collapses it on a narrow
header with its own class:

```jsx
<LogoutButton onClick={logout} icon={<LogOut size={12} />}>
  <span className="hidden sm:inline">LOGOUT</span>
</LogoutButton>
```

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

The dot-matrix city behind the field is `CityMatrix`, and `LoginScreen` renders it
for you — there is nothing to pass. Which city sign-in shows is *suite* identity,
the same argument that makes `SUITE_MODULES` one list, so the Tangerang grid is
bundled rather than chosen per app. Pass `cityMatrix={null}` to drop it, or
`cityMatrixBlink={false}` to still the dots; `prefers-reduced-motion` already
stills them.

It paints on one `<canvas>`, not as elements: a full-bleed 7px grid is ~25k dots on
a desktop viewport, which as DOM nodes or SVG rects is a dead page on the one
screen that has to paint fastest. The dot pitch is a constant, not a fraction of
the viewport — a halftone screen doesn't resize with the page it's printed on — so
the city is cover-fit and cropped instead, and no viewport shows the grid's edge.

New cities come from `tools/city-matrix/generate.py` (build-time only; `files:
["src"]` keeps it out of the package). It rasterizes the OSM road network,
weighting road length by `highway` class, and punches water out as holes. Read that
tool's README before changing its knobs — the weighting and the near-absent radial
falloff are what keep the output from being a flat field or a disc respectively.

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

If your app scales its whole UI (terras-erp divides a `--ui-zoom` factor back out
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

A list toolbar ends with its tally and its actions: `<Window.Count right>412
orders</Window.Count>` pushes the count to the far end, and the actions are
plain `Button`s. erp's `ToolbarButton` is not a separate component here because
its tones are `Button`'s: `create` is `success`, `neutral` is `default`, and
`launch` / `danger` map to `primary` / `danger`. erp's own `launch` and `danger`
gradients are a shade off `BTN_TONES`, which is drift, not a reason for a fifth
and sixth tone.

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
**Give every section an `icon`** unless you want that stripe. `top`, `navEnd` and
`footer` each accept a `({ collapsed }) => node` function for content that can't
survive 44px. `navEnd` renders after the last nav row *inside* the scrolling list
(erp's "Powered by" credit), so it scrolls away with the nav while `footer` stays put.

`expandOnHover` makes the rail open on demand. `collapsed` then means "not
pinned": the sidebar rests at icon width, opens while the pointer (after 120ms)
or keyboard focus is inside it, and closes 200ms after both leave — open fast,
close slow, so cutting a corner on the way to the table doesn't snap it shut. The
exception is a decisive exit: leaving rightward at speed (≥ 600 layout px/s) closes
it at once. That is judged at the edge, not projected ahead of it, so a quick dart
at the band's pin, which sits at the edge, never folds the rail away mid-reach.
That open state is the component's own, the same kind of transient UI state as
its row hover; pinning stays controlled. With `onToggleCollapsed`, the band gets a
pin control — "Pin sidebar open" on a hover-opened band, "Unpin sidebar"
(`aria-pressed`) on a pinned one. `pinIcon={({ pinned }) => …}` draws it from the
app's own icon set; without it, » and «. Start users pinned: the hover rail is
something to opt into, not a layout that changes under someone on day one.
`onExpandedChange(expanded)` reports the width it is drawn at, for a layout that
has to make room for it (a flex row needs nothing — the `<aside>` itself widens).

```jsx
const [pinned, setPinned] = useState(false)

<Sidebar
  expandOnHover
  collapsed={!pinned}
  onToggleCollapsed={() => setPinned(p => !p)}
  onExpandedChange={setRailOpen}   // only if the layout must follow it
  sections={sections}
/>
```

`approachDistance` (layout px) lets the rail start opening before the cursor
touches it: within that distance of its edge, a pointer whose last move —
carried four moves ahead — reaches the rail opens it at once, so it is already
widening on arrival. The heading check is what makes the zone safe to put over
whatever sits beside the rail: a cursor slowing into a table's first column,
drifting or clicking there never opens it.

Inside that zone the rail also reports how close the cursor is, 0 → 1, as the
`--terras-sidebar-approach` property on its `<aside>` and through
`onApproach(progress)`. The package draws nothing from it; the app grows the
rail with it — best over a gutter, where growing moves nothing — and once the
grown rail meets the cursor it opens outright, with no contact delay. Distance
is measured from the rail's resting edge, so the growth never chases the cursor.

Every glide transition (row padding, label fades, the band's controls) takes its
duration and easing from `--terras-sidebar-motion` (default `0.12s`). Set it on an
ancestor — and use the same value for whatever in your layout follows the rail's
width — so the whole shell moves on one curve; switch it with the open/closed
state to give opening and closing different feels — key it off the `<aside>`'s
`data-collapsed` (set in hover mode, in the same render as the layout change),
not off state fed by `onExpandedChange`, which lands a render later.

Touch screens have no hover: start such a device pinned (`matchMedia('(hover: none)')`).

Hover hooks exist on both rows and section bands (`onMouseEnter` / `onMouseLeave`
on an item or a section spec) for app-level work such as a debounced route
prefetch. They fire alongside the Sidebar's own hover paint, never instead of it.

**Both stylesheets are required.** `terras-ui/css` is the custom properties; `terras-ui/chrome` carries the rules an inline style object cannot express (`:hover` / `:focus` / `::placeholder`, scrollbars, and the table `th`/`td` descendant selectors). Without the second one, buttons lose their press motion and tables render unruled. A third, `terras-ui/scale.css`, is optional — see **Interface scale** below.

## Usage (consuming app)

1. Add the dependency. Either:

   **From the git repo (no token)** — what terras-erp uses:

   ```json
   { "dependencies": { "@bryanadamg/terras-ui": "github:bryanadamg/terras-ui#semver:^1.7.0" } }
   ```

   `#semver:` matches the repo's `v*` tags, so `npm update` picks up new 1.x releases once their tag is pushed. `npm install`/`npm update` need `git` (they list the tags); `npm ci` from the lockfile fetches the locked commit as an https tarball and does not, so a git-less image like `node:24-alpine` builds fine. No `.npmrc` needed.

   **From GitHub Packages (token)** — what terras-crm and terras-sku use. Add a scoped registry mapping in the app's `.npmrc` (next to its `package.json` — commit it, it holds no secret):

   ```
   @bryanadamg:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```

   set `NODE_AUTH_TOKEN` (a classic PAT with `read:packages`) wherever `npm install` runs — local shell, CI secret, Docker build secret — and depend on `"@bryanadamg/terras-ui": "^1.0.0"`. GitHub Packages requires the token even for a public package.

2. Import both stylesheets, tokens first:

```ts
import '@bryanadamg/terras-ui/css'     // custom properties
import '@bryanadamg/terras-ui/chrome'  // :hover / :focus / table / scrollbar rules
```

## Interface scale (optional)

The apps are drawn dense enough that the browser's 100% looks oversized on a desktop
monitor — 80% is what operators were reaching for with Ctrl+minus. `terras-ui/scale.css`
+ `terras-ui/scale` are that, packaged: a root `zoom` on `<html>`, driven by a
`data-ui-scale` attribute. Opt-in — import the sheet and nothing changes until an app
stamps the attribute.

```ts
import '@bryanadamg/terras-ui/css'
import '@bryanadamg/terras-ui/chrome'
import '@bryanadamg/terras-ui/scale.css'            // third
import { applyUiScale, readUiScale } from '@bryanadamg/terras-ui/scale'

applyUiScale(readUiScale())   // top of the entry module, before anything renders
```

An SSR app paints one frame of server markup before that runs, which would flash at
full size and snap down. Inline `bootScript` in `<head>` instead (Next: a `<script>`
with `dangerouslySetInnerHTML`, and `suppressHydrationWarning` on `<html>` — the
server markup can't know about the attribute):

```tsx
import { bootScript } from '@bryanadamg/terras-ui/scale'
<script dangerouslySetInnerHTML={{ __html: bootScript }} />
```

Scales are `[70, 75, 80, 90, 100, 110]` (`UI_SCALES`), default 80, persisted under
`localStorage['ui_scale']`. The picker UI is the app's — map `UI_SCALES` into a select
and call `applyUiScale`. Phones and print are pinned back to 1 by the sheet: 44px touch
targets are the point on one, A4 measurements on the other.

Two things an app that opts in has to respect:

- **No raw `vh` / `vw`.** A root zoom does not rescale viewport units, so a bare `100vh`
  renders at 80% of the window. Size against `var(--app-vh)` / `--app-dvh` / `--app-vw`,
  which divide the zoom back out: `calc(var(--app-vh) * 70 / 100)`.
- **Screen px and layout px stop being the same unit.** `getBoundingClientRect()`,
  `clientX/Y`, `innerWidth/Height`, `scrollX/Y` and `movementX/Y` come back divided by the
  zoom; every CSS length you write (`style.top`, a React style prop) is multiplied by it.
  Convert with `toLayoutPx` / `layoutRectOf` / `layoutViewport` / `layoutScroll` from
  `terras-ui/scale` before a measured value becomes a length. Every component in this
  package that measures already does. `uiZoom()` reads the ratio off a fixed-width probe
  rather than `getComputedStyle().zoom`, which older Chromium serializes as `"80%"`.

`.ui-scale-exempt` on a subtree cancels the zoom back to 1:1 — for a WYSIWYG paper
surface, or a widget that measures its own box (a camera viewfinder). A `rectOf` /
`viewportHeight` prop on a component inside one should be passed the raw APIs, so the
correction isn't applied twice.

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

Pushing the tag is the release for apps on the git install; `npm publish` is the release for apps on GitHub Packages. Do both.

From 1.0 the apps take `^1`, so every minor and patch reaches all three on their
next install. Major: removing or renaming an export, entry point, prop or token,
changing what a prop means, or raising a peer dependency. Minor: a new component,
prop or token, or a deliberate visual change to an existing component — say so
in the commit, since it lands in every app without a dependency bump. Patch: a fix
that brings a component back to what it was meant to look like or do.
