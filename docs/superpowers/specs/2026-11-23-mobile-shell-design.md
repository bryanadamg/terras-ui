# MobileShell — design

**Why:** erp (`frontend/app/components/mobile/MobileShell.tsx`) and sku
(`frontend/src/components/layout/MobileShell.tsx`, "after erp's") each hand-keep
the phone shell, and `useIsMobile` exists three times (erp state+effect, sku
`useSyncExternalStore`, a private `useMediaQuery` in `LoginScreen`). Two copies
is how they drift; this package exists to stop that.

**Goals:** one `components/MobileShell` entry owning the phone column layout,
the bottom tab bar and the optional full-menu sheet; one SSR-safe `useIsMobile`.

**Non-goals:** header contents, routing, which tabs exist, auth/logout, theme
toggle — all stay in the apps. Not porting erp/sku in this change (each app
swaps in its own commit after the release).

**Anti-goals:** a router or icon-library dependency; owning menu-open state
the app needs to read; visual drift from what both apps paint today.

## Approaches

1. **Whole shell, slots for the app-specific parts** (picked). Header is a
   node slot, tabs and menu are data with icon slots and `onClick`s.
2. **Only a `TabBar` piece.** Smaller, but each app keeps copying the column
   layout and sku's menu sheet — the drift this is meant to stop.

## API

```ts
MobileShell({
  header?: ReactNode,          // app's header (+ erp's title strip), rendered as-is
  children: ReactNode,         // the routed page; scrolls, never unmounts under the menu
  tabs: { key, label, icon?, active?, onClick }[],
  menu?: { key, label, items: { key, label, icon?, active?, onClick }[] }[],
  menuOpen?: boolean,          // controlled; sku retitles its header while open
  onMenuOpenChange?: (open) => void,
  menuLabel?: string,          // default 'Menu'; the menu tab's label
  menuIcon?: ReactNode,        // the menu tab's icon (slot — app's icon set)
  bodyStyle?: CSSProperties,   // the scroll area (sku pads 6px)
  style?, ...rest              // outer column
})
useIsMobile(): boolean         // (max-width: 767px), false on the server
```

- With `menu` given, a trailing menu tab is appended; it is active while the
  sheet is open **or** when no tab is active (sku: "the bar always says where
  you are"). While the sheet is open no other tab shows active.
- Sheet: absolute over the body, `z-index: 50`, sidebar bg, a flat
  `titleBar` per section, 44px rows (sku's `MenuRow`).
- Tab bar: exactly the shared styling — sidebar tokens, 2px top rule in
  `sidebar-active-color`, 54px min, active = `sidebar-section-bg` fill + white
  text + inset highlight, `aria-current="page"` on the active tab.
- Column height `var(--terras-app-vh, 100dvh)` — erp uses `--app-dvh`,
  sku `h-screen`; the token (default 100dvh; erp overrides it) keeps it scale-safe. `LoginScreen` keeps its own hook (it deliberately reports false on first paint).

## Left to the builder

Exact font sizes (use `fs`), README section, `.d.ts`, `exports` entry.
Release as minor 1.7.0.
