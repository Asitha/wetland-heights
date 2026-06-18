# Nugegoda Toggle Redesign — Spec

## Problem

Two bugs / UX gaps with the current 1 BR / 2 BR toggle on the Nugegoda Residence card:

1. **Image swap broken.** Clicking a tab updates body content (specs, rating, CTA) correctly but the photo stays fixed. Root cause: toggling the `hidden` HTML attribute on `position: absolute` images is unreliable in the browser.
2. **Toggle not discoverable.** The `[1 BR] [2 BR]` pills sit in the top-right corner of the photo. Users read the card top-to-bottom and never reach the image overlay; the option to see the 2 BR unit is routinely missed.

---

## Design

### Image swap — opacity crossfade

Both unit images remain in the DOM at all times, stacked via `position: absolute; inset: 0` (already in place). Visibility is controlled by an `is-active` CSS class rather than the `hidden` attribute.

```
.property-card__unit-img            → opacity: 0; pointer-events: none
.property-card__unit-img.is-active  → opacity: 1; pointer-events: auto
                                       transition: opacity 0.3s ease
```

- The 1 BR image starts with `is-active` in the HTML (`class="property-card__unit-img is-active"`).
- The 2 BR image starts without it (invisible by default).
- JS toggles `is-active` between images on tab click. The `hidden` attribute and tabpanel approach for body content (specs, rating, CTA) is unchanged — it works correctly and is not touched.
- `prefers-reduced-motion`: the opacity transition is wrapped in `@media (prefers-reduced-motion: no-preference)` so it only runs when the user has not requested reduced motion; otherwise opacity switches instantly.

### Tab placement — card body, below title

The `<div class="property-card__tabs">` moves from inside `property-card__image` to inside `property-card__body`, placed between the `<h3>` and the `<p class="property-card__location">`.

```
Nugegoda Residence          ← h3.property-card__name
[1 BR ✓]  [2 BR]           ← div.property-card__tabs  (moved here)
📍 Jumbugasmulla Rd        ← p.property-card__location
[spec chips]
★ 5.0 (18 reviews)
[View on Airbnb ↗]
```

The photo area is left clean — no overlaid controls.

### Tab CSS

`property-card__tabs` loses `position: absolute` and becomes a flow-level flex row with `margin-bottom: 12px` to match the spacing of surrounding elements.

Tab button states:

| State    | Background                  | Text           | Border                          |
|----------|-----------------------------|----------------|---------------------------------|
| Inactive | transparent                 | `--color-text-secondary` | 1px solid `--color-border` |
| Active   | `--color-accent`            | `#fff`         | none                            |
| Hover (inactive) | `--color-surface`  | `--color-text` | 1px solid `--color-border`      |

`min-height: 36px`, `border-radius: 20px`, `padding: 4px 14px`, `font-size: 0.813rem`, `font-weight: 600`. All values reuse existing design tokens.

The dark translucent overlay style (used when tabs were on the image) is removed.

---

## Files Changed

| File | Change |
|------|--------|
| `assets/css/style.css` | Update `.property-card__unit-img` (add opacity transition, remove reliance on `hidden`); update `.property-card__tabs` (remove absolute positioning, add margin); update `.property-card__tab` (new inactive outline style, keep active accent fill) |
| `index.html` | Move `<div class="property-card__tabs">` into card body; add `is-active` class to 1br `<img>`, remove `hidden` from 2br `<img>` |
| `assets/js/toggle.js` | `activate()`: toggle `is-active` class on `.property-card__unit-img` elements; keep `hidden` toggling for tabpanel body content |
| `assets/js/main.js` | Same change as `toggle.js` (inlined copy) |
| `tests/toggle.test.js` | Update image-visibility tests to check `is-active` class instead of `.hidden` property |
| `tests/css-rules.test.js` | Update to assert opacity-based image rules and new tab positioning |

---

## Out of Scope

- Keyboard navigation and ARIA attributes are unchanged.
- No changes to other property cards.
- No changes to the Kotte "Under Renovation" badge.
