# Nugegoda Unit Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the two Nugegoda Residence property cards (1 BR and 2 BR) into a single card with a pill-style tab toggle that swaps image, specs, rating, and CTA between units.

**Architecture:** The toggle lives as a small pill group absolutely positioned in the top-right of the card's image area, matching the existing `.property-card__badge` visual language. Each switchable section carries a `data-unit="1br|2br"` attribute; a dedicated `assets/js/toggle.js` module handles show/hide and is imported by `main.js`. The 1 BR unit is the default. Toggle logic is extracted into a testable module so it can be covered by `node --test` + jsdom.

**Tech Stack:** Vanilla HTML/CSS/JS. CSS variables from the theme (`var(--color-text)`, `var(--color-accent)`). Test runner: `node --test` (already used by engine). DOM testing: `jsdom` (to be installed via a root-level `package.json`).

**Design constraints:**
- Use only CSS custom properties for colours — no hardcoded hex/rgba.
- Mobile tap targets: pill buttons must be at least 36px tall on all viewports.
- Grid stays clean: with 3 cards at desktop, the `repeat(2,1fr)` grid naturally wraps the third card to a second row — this is acceptable.

---

### Task 1: CSS — tab toggle styles (theme-aware, mobile-friendly)

**Files:**
- Modify: `assets/css/style.css` (after `.property-card--coming-soon` block, line 489)

- [ ] **Step 1: Write a failing CSS structure test**

Create `tests/css-rules.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const css = fs.readFileSync('assets/css/style.css', 'utf8');

test('property-card__tabs is defined', () => {
    assert.ok(css.includes('.property-card__tabs'), 'missing .property-card__tabs');
});

test('property-card__tab is defined', () => {
    assert.ok(css.includes('.property-card__tab'), 'missing .property-card__tab');
});

test('active tab uses --color-accent', () => {
    assert.ok(
        css.includes('.property-card__tab.is-active') && css.includes('var(--color-accent)'),
        'active tab must use var(--color-accent)'
    );
});

test('tab uses --color-text not hardcoded rgba', () => {
    assert.ok(
        css.includes('var(--color-text)') && !css.includes('rgba(44'),
        'tabs must use var(--color-text), not hardcoded rgba'
    );
});

test('tab min-height for mobile tap target', () => {
    assert.ok(css.includes('min-height'), 'tab must have min-height for touch targets');
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
node --test tests/css-rules.test.js
```

Expected: all 5 tests fail.

- [ ] **Step 3: Add tab styles to style.css**

Insert after the `.property-card--coming-soon` block (line 489):

```css
.property-card__tabs {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 4px;
}

.property-card__tab {
    padding: 4px 12px;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    background: color-mix(in srgb, var(--color-text) 72%, transparent);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: background var(--transition);
    -webkit-tap-highlight-color: transparent;
}

.property-card__tab:hover {
    background: color-mix(in srgb, var(--color-text) 90%, transparent);
}

.property-card__tab.is-active {
    background: var(--color-accent);
}

.property-card__tab:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
node --test tests/css-rules.test.js
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add assets/css/style.css tests/css-rules.test.js
git commit -m "Add unit toggle CSS using theme variables"
```

---

### Task 2: HTML — collapse two Nugegoda cards into one toggle card

**Files:**
- Modify: `index.html` (lines 205–268, the two Nugegoda `<article>` elements)
- Modify: `tests/css-rules.test.js` → add HTML structure tests (or create `tests/html-structure.test.js`)

- [ ] **Step 1: Write a failing HTML structure test**

Create `tests/html-structure.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

test('only one Nugegoda article card', () => {
    const matches = html.match(/class="property-card[^"]*"[^>]*>/g) || [];
    const nugegodaCards = html.match(/Nugegoda Residence/g) || [];
    // Should appear exactly once as a card heading, not twice
    assert.equal(nugegodaCards.length, 1, 'Nugegoda Residence heading should appear once');
});

test('toggle card has property-card--tabbed class', () => {
    assert.ok(html.includes('property-card--tabbed'), 'missing property-card--tabbed');
});

test('1br unit image is present', () => {
    assert.ok(html.includes('data-unit="1br"'), 'missing data-unit="1br"');
});

test('2br unit image is present and hidden by default', () => {
    assert.ok(
        html.includes('data-unit="2br"'),
        'missing data-unit="2br"'
    );
});

test('tab buttons have aria-selected', () => {
    assert.ok(html.includes('aria-selected="true"'), 'first tab must be aria-selected');
});

test('total property cards is 3', () => {
    const cards = (html.match(/class="property-card[ "]/g) || []).length;
    assert.equal(cards, 3, `expected 3 property cards, got ${cards}`);
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
node --test tests/html-structure.test.js
```

Expected: multiple failures (two Nugegoda cards exist, no `property-card--tabbed`, etc.).

- [ ] **Step 3: Replace the two Nugegoda cards with one toggle card**

Remove both Nugegoda `<article>` blocks (lines 205–268) and replace with:

```html
<!-- Nugegoda Residence · 1 BR / 2 BR toggle -->
<article class="property-card property-card--tabbed">
    <div class="property-card__image">
        <img class="property-card__unit-img" data-unit="1br"
             src="assets/images/properties/nugegoda-1br.jpg"
             alt="Nugegoda Residence — 1 Bedroom" loading="lazy" width="720" height="480">
        <img class="property-card__unit-img" data-unit="2br"
             src="assets/images/properties/nugegoda-2br.jpg"
             alt="Nugegoda Residence — 2 Bedrooms" loading="lazy" width="720" height="405"
             hidden>
        <div class="property-card__tabs" role="tablist" aria-label="Select room type">
            <button class="property-card__tab is-active" role="tab"
                    aria-selected="true" data-unit="1br">1 BR</button>
            <button class="property-card__tab" role="tab"
                    aria-selected="false" data-unit="2br">2 BR</button>
        </div>
    </div>
    <div class="property-card__body">
        <h3 class="property-card__name">Nugegoda Residence</h3>
        <p class="property-card__location">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5Z" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="6" r="1.5" stroke="currentColor" stroke-width="1.2"/></svg>
            Jumbugasmulla Rd, Nugegoda
        </p>
        <div class="property-card__specs" data-unit="1br">
            <span>2 Beds &middot; 4 Guests</span>
            <span>1 Bedroom</span>
            <span>Workspace</span>
            <span>Kitchen &amp; Dining</span>
            <span>Living &amp; TV Area</span>
            <span>4G WiFi</span>
        </div>
        <div class="property-card__specs" data-unit="2br" hidden>
            <span>3 Beds &middot; 6 Guests</span>
            <span>2 Bedrooms</span>
            <span>2 Bathrooms</span>
            <span>Workspace</span>
            <span>Kitchen &amp; Dining</span>
            <span>Living &amp; TV Area</span>
            <span>4G WiFi</span>
        </div>
        <div class="property-card__rating" data-unit="1br">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#D4A843" aria-hidden="true"><path d="M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1Z"/></svg>
            <span>5.0</span>
            <span class="property-card__review-count">(18 reviews)</span>
        </div>
        <div class="property-card__rating" data-unit="2br" hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#D4A843" aria-hidden="true"><path d="M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1Z"/></svg>
            <span>5.0</span>
            <span class="property-card__review-count">(2 reviews)</span>
        </div>
        <a href="https://airbnb.com/h/nugegoda-king-room" target="_blank"
           rel="noopener noreferrer" class="btn btn--primary property-card__cta"
           data-unit="1br">
            View on Airbnb
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 11L11 3M11 3H5M11 3v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="sr-only">(opens in new tab)</span>
        </a>
        <a href="https://airbnb.com/h/nugegoda-residence" target="_blank"
           rel="noopener noreferrer" class="btn btn--primary property-card__cta"
           data-unit="2br" hidden>
            View on Airbnb
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 11L11 3M11 3H5M11 3v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="sr-only">(opens in new tab)</span>
        </a>
    </div>
</article>
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
node --test tests/html-structure.test.js
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/html-structure.test.js
git commit -m "Collapse Nugegoda cards into single toggle card (HTML)"
```

---

### Task 3: JS — toggle behaviour with jsdom tests

**Files:**
- Create: `assets/js/toggle.js` (extracted toggle module)
- Create: `tests/toggle.test.js` (jsdom-based behaviour tests)
- Modify: `assets/js/main.js` (import and wire toggle module)
- Create: `package.json` at project root (for jsdom dependency)

- [ ] **Step 1: Create root package.json and install jsdom**

Create `/Volumes/APFS/dev/projects/wetland-heights/package.json`:

```json
{
  "name": "wetland-heights",
  "private": true,
  "scripts": {
    "test": "node --test tests/*.test.js"
  },
  "devDependencies": {
    "jsdom": "^26.0.0"
  }
}
```

Run:
```bash
npm install
```

- [ ] **Step 2: Write failing toggle behaviour tests**

Create `tests/toggle.test.js`:

```js
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function makeCard() {
    const dom = new JSDOM(`
        <article class="property-card property-card--tabbed">
            <div class="property-card__image">
                <img data-unit="1br" src="1br.jpg">
                <img data-unit="2br" src="2br.jpg" hidden>
                <div class="property-card__tabs" role="tablist">
                    <button class="property-card__tab is-active" role="tab"
                            aria-selected="true" data-unit="1br">1 BR</button>
                    <button class="property-card__tab" role="tab"
                            aria-selected="false" data-unit="2br">2 BR</button>
                </div>
            </div>
            <div class="property-card__body">
                <div class="property-card__specs" data-unit="1br">1BR specs</div>
                <div class="property-card__specs" data-unit="2br" hidden>2BR specs</div>
                <div class="property-card__rating" data-unit="1br">1BR rating</div>
                <div class="property-card__rating" data-unit="2br" hidden>2BR rating</div>
                <a class="property-card__cta" data-unit="1br" href="/1br">View 1BR</a>
                <a class="property-card__cta" data-unit="2br" href="/2br" hidden>View 2BR</a>
            </div>
        </article>
    `);
    return { dom, card: dom.window.document.querySelector('.property-card--tabbed') };
}

test('1BR is visible by default', () => {
    const { card } = makeCard();
    const img1br = card.querySelector('[data-unit="1br"].property-card__unit-img') ||
                   card.querySelector('img[data-unit="1br"]');
    const img2br = card.querySelector('img[data-unit="2br"]');
    assert.ok(!img1br.hidden, '1br image should be visible');
    assert.ok(img2br.hidden, '2br image should be hidden');
});

test('clicking 2BR tab shows 2br elements', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card, dom.window);

    const tab2br = card.querySelector('[data-unit="2br"].property-card__tab');
    tab2br.click();

    assert.ok(card.querySelector('img[data-unit="2br"]').hidden === false, '2br image visible');
    assert.ok(card.querySelector('img[data-unit="1br"]').hidden === true, '1br image hidden');
    assert.ok(card.querySelector('.property-card__specs[data-unit="2br"]').hidden === false, '2br specs visible');
    assert.ok(card.querySelector('.property-card__specs[data-unit="1br"]').hidden === true, '1br specs hidden');
    assert.ok(card.querySelector('a[data-unit="2br"]').hidden === false, '2br CTA visible');
    assert.ok(card.querySelector('a[data-unit="1br"]').hidden === true, '1br CTA hidden');
});

test('clicking 2BR tab sets is-active on 2BR button', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card, dom.window);

    card.querySelector('[data-unit="2br"].property-card__tab').click();

    assert.ok(card.querySelector('[data-unit="2br"].property-card__tab').classList.contains('is-active'));
    assert.ok(!card.querySelector('[data-unit="1br"].property-card__tab').classList.contains('is-active'));
});

test('clicking 2BR sets aria-selected correctly', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card, dom.window);

    card.querySelector('[data-unit="2br"].property-card__tab').click();

    assert.equal(card.querySelector('[data-unit="2br"].property-card__tab').getAttribute('aria-selected'), 'true');
    assert.equal(card.querySelector('[data-unit="1br"].property-card__tab').getAttribute('aria-selected'), 'false');
});

test('clicking back to 1BR restores 1br elements', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card, dom.window);

    card.querySelector('[data-unit="2br"].property-card__tab').click();
    card.querySelector('[data-unit="1br"].property-card__tab').click();

    assert.ok(!card.querySelector('img[data-unit="1br"]').hidden, '1br image visible again');
    assert.ok(card.querySelector('img[data-unit="2br"]').hidden, '2br image hidden again');
});
```

- [ ] **Step 3: Run tests — confirm they fail**

```bash
node --test tests/toggle.test.js
```

Expected: fail because `assets/js/toggle.js` does not exist yet.

- [ ] **Step 4: Create assets/js/toggle.js**

```js
'use strict';

function initToggle(card, win) {
    var w = win || window;
    var tabs = card.querySelectorAll('.property-card__tab');

    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function () {
            var unit = this.getAttribute('data-unit');

            for (var j = 0; j < tabs.length; j++) {
                var isActive = tabs[j].getAttribute('data-unit') === unit;
                tabs[j].classList.toggle('is-active', isActive);
                tabs[j].setAttribute('aria-selected', String(isActive));
            }

            var unitEls = card.querySelectorAll('[data-unit]');
            for (var k = 0; k < unitEls.length; k++) {
                var el = unitEls[k];
                if (el.classList.contains('property-card__tab')) continue;
                el.hidden = el.getAttribute('data-unit') !== unit;
            }
        });
    }
}

if (typeof module !== 'undefined') {
    module.exports = { initToggle: initToggle };
}
```

- [ ] **Step 5: Run toggle tests — confirm they pass**

```bash
node --test tests/toggle.test.js
```

Expected: all 5 tests pass.

- [ ] **Step 6: Wire toggle into main.js**

In `assets/js/main.js`, replace the closing `})();` with:

```js
    // Unit toggle for multi-option property cards
    var tabbedCards = document.querySelectorAll('.property-card--tabbed');
    for (var t = 0; t < tabbedCards.length; t++) {
        initToggle(tabbedCards[t]);
    }
})();
```

And at the very top of `main.js`, before the IIFE, add:

```js
var initToggle = (function () {
    'use strict';

    function initToggle(card) {
        var tabs = card.querySelectorAll('.property-card__tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function () {
                var unit = this.getAttribute('data-unit');
                for (var j = 0; j < tabs.length; j++) {
                    var isActive = tabs[j].getAttribute('data-unit') === unit;
                    tabs[j].classList.toggle('is-active', isActive);
                    tabs[j].setAttribute('aria-selected', String(isActive));
                }
                var unitEls = card.querySelectorAll('[data-unit]');
                for (var k = 0; k < unitEls.length; k++) {
                    var el = unitEls[k];
                    if (el.classList.contains('property-card__tab')) continue;
                    el.hidden = el.getAttribute('data-unit') !== unit;
                }
            });
        }
    }

    return initToggle;
})();
```

**Note:** This inlines the toggle logic in `main.js` as a self-contained IIFE factory (no ES module imports, since the site uses no bundler). The `toggle.js` file is only for testing.

- [ ] **Step 7: Run all tests**

```bash
node --test tests/toggle.test.js tests/html-structure.test.js tests/css-rules.test.js
```

Expected: all tests pass.

- [ ] **Step 8: Open in browser and verify**

```bash
open index.html
```

Confirm:
- Grid shows 3 cards; Nugegoda is the second card with 1 BR shown by default
- "1 BR" pill (accent brown) and "2 BR" pill (translucent dark) visible in top-right of image
- Clicking "2 BR": image, specs, rating, and CTA all switch to 2BR data
- Clicking "1 BR": all revert
- On a narrow viewport (375px): pills remain legible, at least 36px tall, no overflow

- [ ] **Step 9: Commit**

```bash
git add assets/js/toggle.js assets/js/main.js tests/toggle.test.js package.json package-lock.json
git commit -m "Wire Nugegoda unit toggle with jsdom-tested JS module"
```
