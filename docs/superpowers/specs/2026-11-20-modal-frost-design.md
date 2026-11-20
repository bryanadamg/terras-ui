# Modal "Sapphire Frost" restyle — design

## Why
The main page moved to Sapphire Frost (near-white cool rail, flat sapphire
section bands, flat accent title band, inset card with a 1px border and 8px
radius). Modals still wear XP beige and a grey bevel, so a dialog opened over
the page reads as a different, older app. Goal: the modal looks like it
belongs to the page behind it.

## Goals
- Modal frame, body, footer and FormSection match the page's palette and frame.
- Same look in all three apps (erp, sku, crm), not just erp.

## Non-goals
- Field/dropdown styling inside forms (erp's two select styles are erp form code; separate fix).
- `Window` / `bevel` (page windows), toolbars, tabs, Combobox.
- Blueprint and modern themes: they must resolve exactly as today.

## Anti-goals
- A rounded white card that ignores the page's chrome (Modal.js's own warning).
- Changing shared tokens (`win-face`, `win-bg`, `win-border-soft`) — they paint toolbars, tabs, Combobox in all apps.

## Approaches considered
- **A. Restyle Modal + FormSection in terras-ui with new modal tokens (picked).** One change, all three apps stay one design.
- B. Change `win-face`/`win-bg` — restyles far more than the modal and keeps the bevel.
- C. Override in erp's globals.css — sku/crm keep the old modal; the drift the package exists to end.

Section headers: **solid accent band (picked)** over a light no-band label —
it echoes the sidebar's flat sapphire section bands, so modal and page share one vocabulary.

## Decided (classic theme only)
| Part | Now | New |
|---|---|---|
| Modal frame | 2px grey bevel (`S.bevel`), 2px hard shadow | 1px solid `win-border-dark` (same as erp's main card), 8px radius, soft lifted shadow |
| Modal body | `win-face` `#f0f0e8` | `#f6f8fc` |
| Modal footer | `win-bg` `#ece9d8`, 1px `win-border-dark` rule | `#eef2f9`, 1px `#d3dae8` hairline |
| Title bar (`--terras-title-blue`) | accent → accent-bright gradient | flat `var(--terras-accent)`; inactive flat `var(--terras-accent-inactive)` (mirrors erp's globals.css) |
| FormSection header (`--terras-form-section-blue`) | `#3a6fc4` | `var(--terras-accent)` |
| FormSection border | `win-border-soft` `#c0bdb5` | `#d3dae8` |

- New tokens (`--terras-modal-*`, `--terras-form-section-border`) declared in the
  `.ui-style-classic` block, in both tokens.css and tokens.json.
- Components read the new tokens with a fallback to what they read today
  (e.g. `var(--terras-modal-bg, var(--terras-win-face, #f0f0e8))`), so blueprint
  and modern are unchanged.
- Modal stops using `S.bevel` for its frame; `bevel` itself is untouched.
- Release: minor (1.5.0), commit says "deliberate visual change".
- erp: delete ModalWrapper.tsx's hard-coded beige body gradient (line ~95) so
  the package's body colour shows; bump terras-ui. Its `--xp-title-blue`
  override becomes redundant but stays (out of scope).

## Left to the builder
- Exact token names and the shadow values (blocking vs. the deeper modeless lift).
- Whether the title bar's inset highlight stays on the flat band.
- Updating README's Modal/FormSection rationale and the header comments in both files.

## Verification
- `node tools/check-tokens.js` — the only changed tokens are the ones listed above.
- Read erp ModalWrapper + one FormSection page view (e.g. SettingsPanel) and one
  sku dialog against the new code.

## Addendum (2026-11-20): also in 1.5.0
Approved after the first preview: header controls looked out of place on the
flat band, and the modal title bar should carry erp's header dot matrix.

1. **Modal title dots.** erp `.classic-header` recipe — white dots at 22% on a
   5px grid, visible from ~40% of the width to the right edge. A decorative
   layer inside Modal's title bar (behind title + close box, no pointer events),
   masked rather than colour-faded so it works on every tone. Token
   `--terras-modal-title-dots`, classic only; absent = no dots.
2. **Close box goes ghost** (`WindowCloseButton`, everywhere it renders):
   transparent face, faint white border at rest, red on hover unchanged.
   Classic only; other themes keep the grey face.
3. **`HeaderButton` + `HeaderSelect`** (new entry `components/HeaderButton`):
   ghost controls for the app header band — transparent, white text/icon, faint
   1px white border, 22px; hover = light white wash, pressed = slight darkening
   (chrome.css). Select gets a currentColor chevron and dark-on-white options.
   Tokens `--terras-header-btn-*` in `:root` (the band exists in every theme).
   Controlled only (`onClick`, `value`/`onChange`). LogoutButton stays flat red.
   App swaps follow the release: erp QR/Feedback/EN + delete
   `.classic-header .btn-*`/`form-select` rules; sku Feedback; crm Search.
