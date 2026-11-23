# MobileShell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `components/MobileShell` (phone column + tab bar + optional menu sheet) and `useIsMobile`, replacing the hand copies in erp and sku.

**Architecture:** One plain-`createElement` CommonJS file with a hand-written `.d.ts`, built on `styles.js` (`cssVar`, `fs`, `font`, `titleBar`, `trackingCaps`). Header, icons and navigation are slots/callbacks; menu-open is controlled by the app.

**Tech Stack:** React (peer), no build, no runtime deps.

**Spec:** `docs/superpowers/specs/2026-11-23-mobile-shell-design.md`

## Global Constraints

- No JSX, no new dependency, no hard-coded colour except `#ffffff` active text fallback via `S.cssVar('on-solid', '#ffffff')` and black/white alpha shadows.
- Tab bar tokens: `sidebar-bg #f6f8fc`, `sidebar-active-color #10276b`, `sidebar-item-border #e3e8f1`, `sidebar-section-bg #1f4fd1`, menu row active `sidebar-active-bg #ffffff`.
- Breakpoint `(max-width: 767px)` (same line as `scale.css`); `useIsMobile` returns `false` on the server.
- Column height `var(--terras-app-vh, 100dvh)`.
- Commit messages: one line, conventional prefix, no co-author trailer.
- Minor release (1.7.0) — release itself is a separate `/release` run, not part of this plan.

## Review Focus

- Path matches no tab (e.g. `/settings`) with `menu` given → menu tab shows active; without `menu` → no tab active, nothing breaks.
- Menu open → page children stay mounted (half-typed input survives); only the sheet overlays.
- Server render (erp is Next) → `useIsMobile` must not throw (`useSyncExternalStore` needs `getServerSnapshot`).
- `menuOpen` given without `onMenuOpenChange` → menu tab click is a no-op, no crash.
- `icon` omitted on a tab/row → renders label only, no empty-gap layout break.

Tests for all five are in Task 1's check script.

---

### Task 1: MobileShell component + useIsMobile

**Files:**
- Create: `src/components/MobileShell.js`, `src/components/MobileShell.d.ts`
- Modify: `package.json` `exports` — add `"./components/MobileShell": { "types": "./src/components/MobileShell.d.ts", "default": "./src/components/MobileShell.js" }` next to `HeaderButton`
- Test: scratchpad `check-mobile-shell.js` (repo has no test runner; not committed)

**Interfaces:**
- Produces: `module.exports = MobileShell; module.exports.default = MobileShell; module.exports.MobileShell = MobileShell; module.exports.useIsMobile = useIsMobile` (match how `HeaderButton.js` exports named + default — copy its pattern).
- Types: `MobileNavItem { key: string; label: ReactNode; icon?: ReactNode; active?: boolean; onClick: () => void }`, `MobileNavSection { key: string; label: ReactNode; items: MobileNavItem[] }`, `MobileShellProps` per spec API (plus `React.HTMLAttributes<HTMLDivElement>` rest on the outer div), `useIsMobile(): boolean`.

- [ ] **Step 1: Write the check** — renders with `react-dom/server` `renderToStaticMarkup`, run via `NODE_PATH=~/Documents/Work/TWA/terras-sku/frontend/node_modules`. Assertions:
  - 2 tabs, `tabs[1].active` → exactly one `aria-current="page"`, on tab 2's button.
  - With `menu` + no active tab + `menuOpen:false` → menu tab (last button in `nav[aria-label="Primary"]`) carries `aria-current="page"`; no `nav[aria-label="Menu"]`.
  - With `menuOpen:true` + `tabs[0].active` → only menu tab has `aria-current`; `nav[aria-label="Menu"]` present with one section label and its rows; children string still in markup.
  - No `menu` → no menu tab rendered.
  - Tab without `icon` renders (no throw).
  - `useIsMobile` in a component under `renderToStaticMarkup` → `false`, no throw.
  - Markup contains `var(--terras-sidebar-section-bg, #1f4fd1)` and `var(--terras-app-vh, 100dvh)`.

- [ ] **Step 2: Run it** — `NODE_PATH=… node <scratchpad>/check-mobile-shell.js` → fails (module not found).

- [ ] **Step 3: Implement `src/components/MobileShell.js`**
  - Outer `div`: flex column, height `var(--terras-app-vh, 100dvh)`, `overflow: hidden`, `fontFamily: S.font`, merge `style`, spread rest.
  - `header` rendered as-is (wrapped in nothing).
  - Body `div`: `position: relative`, `flex: 1`, `minHeight: 0`, `overflowY: auto`, `overflowX: hidden`, merge `bodyStyle`; children, then the sheet when `menu && menuOpen`.
  - Sheet: `nav aria-label="Menu"`, `position:absolute; inset:0; overflowY:auto; zIndex:50`, sidebar bg; per section `div` with `S.titleBar({ padding: '6px 10px', fontSize: S.fs.base })` + uppercase `trackingCaps` label span, then rows: `button type=button`, flex, gap 10, width 100%, minHeight 44, padding `0 14px`, bottom rule, active bg `sidebar-active-bg`, colour `sidebar-active-color`, `fontSize: S.fs.title`, bold when active, `aria-current` when active, icon slot in a `line-height:0` span. Row click calls `item.onClick()` then `onMenuOpenChange?.(false)`.
  - Tab bar: `nav aria-label="Primary"`, `display:flex`, sidebar bg, `borderTop: 2px solid` active-color, `flexShrink:0`. Each tab `button type=button`: `flex:1, minWidth:0, minHeight:54`, column, centred, gap 3, padding `6px 2px 8px`, no border except right rule between tabs, active → section-bg fill, `on-solid` text, `inset 0 1px 0 rgba(255,255,255,0.3)`, bold; `fontSize: S.fs.sub`; icon in a `line-height:0` span.
  - Effective active: when `menu` given and `menuOpen` → tabs all inactive, menu tab active; when `menu` given and no tab active → menu tab active. Menu tab = `{ key: '__menu', label: menuLabel || 'Menu', icon: menuIcon, onClick: () => onMenuOpenChange?.(!menuOpen) }`. Tab clicks also call `onMenuOpenChange?.(false)` when the menu is open.
  - `useIsMobile`: `React.useSyncExternalStore(subscribe, () => matchMedia(Q).matches, () => false)` with the `typeof window.matchMedia === 'function'` guard (sku's version + server snapshot).
  - Header comment: why it exists (erp + sku copies), slots-not-deps, menu kept controlled because sku retitles its header.

- [ ] **Step 4: Write `MobileShell.d.ts`** per Interfaces; add the `exports` entry.

- [ ] **Step 5: Run the check** → all assertions pass; `node -e "require('./package.json').exports['./components/MobileShell']"` resolves both paths exist.

- [ ] **Step 6: Commit** — `feat: add MobileShell and useIsMobile, the phone shell erp and sku each hand-keep`

### Task 2: README

**Files:** Modify `README.md` — add `MobileShell` to the `### Components` list and a section alongside the other component sections (usage snippet with `header`, `tabs`, `menu`/`menuOpen`, `useIsMobile` gate in the app shell; note header/routing/icons stay in the app and that menu-open is controlled).

- [ ] **Step 1:** Write the section, matching the neighbouring sections' format.
- [ ] **Step 2: Commit** — `docs: document MobileShell`
