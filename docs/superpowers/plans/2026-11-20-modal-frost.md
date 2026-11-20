# Modal Sapphire Frost Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make terras-ui's `Modal` and `FormSection` wear the page's Sapphire Frost palette and frame under `.ui-style-classic`, and let erp's modals show it.

**Architecture:** New classic-only tokens carry every new value; components read them with a fallback to exactly what they read today, so blueprint and modern resolve unchanged. Three existing classic tokens change value on purpose (title band flat, form-section band = accent). erp drops its hard-coded body gradient and bumps the package.

**Tech Stack:** Hand-written CommonJS `React.createElement`, `src/tokens/tokens.css` + `tokens.json` (hand-kept in sync), `tools/check-tokens.js`. No test runner exists — verification is the token check plus reading the consuming code.

**Spec:** `docs/superpowers/specs/2026-11-20-modal-frost-design.md`

## Global Constraints

- Classic theme only. Blueprint and no-theme (modern) must resolve exactly as at HEAD.
- Do not change `win-face`, `win-bg`, `win-border-soft`, or `S.bevel` / `Window`.
- Components never hard-code a colour: `S.cssVar(token, fallback)`; only black alpha shadows stay literal.
- Token scope rule: a classic-block token may `var()` only classic-block or `:root` tokens.
- tokens.json stores resolved literals in camelCase; keep existing key names (renaming a key is a major).
- Release is minor (1.5.0); commits that change the look say "deliberate visual change".
- Commits: one line, conventional prefix, no Co-Authored-By trailer; terras-ui commits use `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE` = `date -v+12H '+%Y-%m-%dT%H:%M:%S%z'`. erp commits use real time.

## Review Focus

- Blueprint / modern modal: frame, body, footer and FormSection must look exactly as before (fallback chains). Checked by Task 1 Step 3 (no blueprint/root diffs) and Task 2 Step 3 (fallbacks read back to the old tokens).
- Modeless (floating) modal: still gets a deeper shadow than a blocking one and stays draggable. Task 2 Step 3.
- The modal title text and close box stay legible on the flat accent band (white on `#1f4fd1`). Task 1 values.
- FormSection used on erp *page* views (SettingsPanel, RoutingView…) also changes — intended per spec; confirm it isn't a modal-only assumption. Task 2 Step 4.
- erp modal body must not keep a beige band after Task 4 (any other `#f1efe5`/`#e5e2d3` literals in ModalWrapper/PrintModalShell). Task 4 Step 1.

---

### Task 1: Tokens

**Files:**
- Modify: `src/tokens/tokens.css` (classic block: title-blue lines ~280–283, form-section-blue ~450, new modal group)
- Modify: `src/tokens/tokens.json` (`classic`: `titleBlueGradient`, `titleBlueGradientInactive`, `formSectionBlue`, new keys)

**Interfaces:**
- Produces (classic block only): `--terras-modal-bg: #f6f8fc`, `--terras-modal-footer-bg: #eef2f9`, `--terras-modal-footer-border: #d3dae8`, `--terras-modal-border-width: 1px`, `--terras-modal-border-color: var(--terras-win-border-dark)`, `--terras-modal-shadow: 0 8px 24px rgba(0, 0, 0, 0.22)`, `--terras-modal-shadow-float: 0 10px 28px rgba(0, 0, 0, 0.3)`, `--terras-form-section-border: #d3dae8`.
- Changes: `--terras-title-blue: var(--terras-accent)`, `--terras-title-blue-inactive: var(--terras-accent-inactive)`, `--terras-form-section-blue: var(--terras-accent)`.
- JSON keys: `modalBg`, `modalFooterBg`, `modalFooterBorder`, `modalBorderWidth`, `modalBorderColor` (`#808080`), `modalShadow`, `modalShadowFloat`, `formSectionBorder`; `titleBlueGradient` → `#1f4fd1`, `titleBlueGradientInactive` → `#7a96b8`, `formSectionBlue` → `#1f4fd1`.

- [ ] **Step 1:** Edit tokens.css: the three value changes, plus a commented `/* Modal (Sapphire Frost) */` group near form-section-blue declaring the eight new tokens. Update the form-section-blue comment to say it follows the accent.
- [ ] **Step 2:** Mirror in tokens.json `classic` with resolved literals.
- [ ] **Step 3:** Run `node tools/check-tokens.js`. Expected: FAIL listing exactly three changed tokens — `title-blue`, `title-blue-inactive`, `form-section-blue` — all under the classic scope only (none under `:root` or blueprint), and the eight new tokens listed as added. No scope-rule errors. Anything else changed = fix before continuing.
- [ ] **Step 4:** Commit (+12h): `feat: add Sapphire Frost modal tokens and flatten the classic title band and form-section band to the accent (deliberate visual change)`

### Task 2: Modal and FormSection read the new tokens

**Files:**
- Modify: `src/components/Modal.js` (panel style ~L250–262, floatingStyle boxShadow ~L230, body ~L307, footer ~L318–327, header comment)
- Modify: `src/components/FormSection.js` (border + boxShadow ~L35–36, header comment)
- Modify: `README.md:20,22` (Modal / FormSection rows)

**Interfaces:**
- Consumes: Task 1 token names.
- Produces: no API change; `.d.ts` files untouched.

- [ ] **Step 1: Modal.js.** Keep `S.bevel(...)`, override inside its `extra`: `borderWidth: S.cssVar('modal-border-width', '2px')`, `borderColor: S.cssVar('modal-border-color', <bevel's current four-value borderColor string>)`, `boxShadow: S.cssVar('modal-shadow', S.cssVar('shadow-panel', '2px 2px 4px rgba(0,0,0,0.3)'))`. Floating `boxShadow` → `S.cssVar('modal-shadow-float', '4px 4px 14px rgba(0,0,0,0.4)')`. Body background → `S.cssVar('modal-bg', S.cssVar('win-face', '#f0f0e8'))`. Footer background → `S.cssVar('modal-footer-bg', S.cssVar('win-bg', '#ece9d8'))`, borderTop colour → `S.cssVar('modal-footer-border', S.cssVar('win-border-dark', '#808080'))`. Order matters: `floatingStyle` and `props.style` must still merge after these so callers can override.
- [ ] **Step 2: FormSection.js.** Both uses of `win-border-soft` (border and the outer 1px box-shadow) → `S.cssVar('form-section-border', S.cssVar('win-border-soft', '#c0bdb5'))`. Header already reads `form-section-blue`; no change.
- [ ] **Step 3: Verify by reading.** `grep -n "cssVar('win-face'\|cssVar('win-bg'\|4px 4px 14px" src/components/Modal.js` shows each only as an inner fallback. With no theme class, every new `var(--terras-modal-*, X)` falls to X = the old value; confirm the bevel borderColor fallback string equals what `S.bevel` sets. Modeless still sets `cursor: move` on the title bar and the float shadow differs from the blocking one.
- [ ] **Step 4:** Update README rows: Modal — "Window's title bar one layer up, framed like the page card (1px border, soft shadow) on the Frost palette…"; FormSection — "Field group under a flat accent header bar". Update the header comments in both files to match (Modal.js's "SAME chrome as `Window`" claim no longer holds for the frame — say the title bar and palette are shared, the frame follows the page card). Confirm FormSection's page-view callers in erp (`grep -rl "terras-ui/components/FormSection" ~/Documents/Work/BIE/terras-erp/frontend/app`) only pass `title`/`icon`/`right`/`style`/`bodyStyle` — nothing assumes the old border.
- [ ] **Step 5:** Commit (+12h): `feat: frame Modal like the page card on the Sapphire Frost palette and give FormSection a cool border (deliberate visual change)`

### Task 3: Release terras-ui 1.5.0

- [ ] **Step 1:** Run the `/release` project skill (minor → 1.5.0). It pauses for confirmation before merge, push and publish — do not chain past those.

### Task 4: erp adopts it

**Files:**
- Modify: `~/Documents/Work/BIE/terras-erp/frontend/app/components/shared/ModalWrapper.tsx:95`
- Modify: `~/Documents/Work/BIE/terras-erp/frontend/package.json` + lockfile (terras-ui → `^1.5.0`)

- [ ] **Step 1:** Delete the body `background: 'linear-gradient(to bottom, #f1efe5 0%, #e5e2d3 100%)'` line so Modal's body colour shows through (the outer `bodyStyle` already sets `background: 'none'`). `grep -n "f1efe5\|e5e2d3\|ece9d8\|f0f0e8" app/components/shared/ModalWrapper.tsx app/components/shared/PrintModalShell.tsx` — report any remaining hits to the user rather than changing PrintModalShell (out of scope).
- [ ] **Step 2:** Install `@bryanadamg/terras-ui@^1.5.0` (token in terras-sku's `.env` as `NODE_AUTH_TOKEN`); confirm `node_modules/@bryanadamg/terras-ui/package.json` reads 1.5.0.
- [ ] **Step 3:** Run erp's typecheck/lint as in its own package.json scripts; expected: no new errors.
- [ ] **Step 4:** Commit (real time, on erp's `dev`): `style: modals take terras-ui 1.5.0's Sapphire Frost frame and drop ModalWrapper's beige body`
