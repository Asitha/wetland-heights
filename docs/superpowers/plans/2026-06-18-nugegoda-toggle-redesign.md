# Nugegoda Toggle Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken image swap on the Nugegoda 1BR/2BR toggle and move the tab pills into the card body so they're discoverable.

**Architecture:** Two independent fixes land together. (1) Images switch via an `is-active` CSS class (`opacity: 0/1`) instead of the `hidden` HTML attribute, which is unreliable on `position: absolute` elements. (2) The `<div class="property-card__tabs">` moves from the photo overlay into `property-card__body`, placed between the `<h3>` and the location line, making it a natural part of the reading flow. ARIA structure and keyboard navigation are untouched.

**Tech Stack:** Vanilla HTML/CSS/JS, Node.js `--test` runner, jsdom (already installed).

---

## File Map

| File | Change |
|------|--------|
| `tests/css-rules.test.js` | Replace 3 tests that assert the old overlay style; add 2 tests for opacity rules |
| `assets/css/style.css` | Replace `.property-card__unit-img`, `.property-card__tabs`, `.property-card__tab` blocks |
| `tests/toggle.test.js` | Update `makeCard()` factory and all image-visibility assertions |
| `assets/js/toggle.js` | Split `activate()` so images get `is-active` class, body content keeps `hidden` |
| `index.html` | Add `is-active` to 1br img; remove `hidden` from 2br img; move tabs div to body |

`assets/js/main.js` — **no change needed**. It already delegates to `initToggle()` from toggle.js.

---

## Task 1: Update CSS tests and CSS

**Files:**
- Modify: `tests/css-rules.test.js`
- Modify: `assets/css/style.css:491-534`

- [ ] **Step 1: Overwrite `tests/css-rules.test.js` with updated tests**

Replace the entire file:

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const css = fs.readFileSync('assets/css/style.css', 'utf8');

function extractBlock(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped + '\\s*\\{([^}]+)\\}');
    const m = css.match(re);
    return m ? m[1] : '';
}

test('property-card__unit-img is invisible by default via opacity', () => {
    const block = extractBlock('.property-card__unit-img');
    assert.ok(block.includes('opacity: 0'), 'inactive image must have opacity: 0');
    assert.ok(block.includes('pointer-events: none'), 'inactive image must have pointer-events: none');
});

test('property-card__unit-img.is-active is fully visible', () => {
    const block = extractBlock('.property-card__unit-img.is-active');
    assert.ok(block.includes('opacity: 1'), 'active image must have opacity: 1');
});

test('property-card__tabs is flow-level with margin-bottom', () => {
    const block = extractBlock('.property-card__tabs');
    assert.ok(!block.includes('position: absolute'), 'tabs must not be position absolute');
    assert.ok(block.includes('margin-bottom'), 'tabs must have margin-bottom for spacing');
});

test('property-card__tab has min-height for mobile tap target', () => {
    const block = extractBlock('.property-card__tab');
    assert.ok(block.includes('min-height'), 'must have min-height');
    assert.ok(block.includes('36px'), 'min-height must be 36px');
});

test('property-card__tab inactive state has transparent bg with border', () => {
    const block = extractBlock('.property-card__tab');
    assert.ok(block.includes('transparent'), 'inactive tab background must be transparent');
    assert.ok(block.includes('var(--color-border)'), 'inactive tab must use --color-border');
    assert.ok(block.includes('var(--color-text-secondary)'), 'inactive tab text must use --color-text-secondary');
});

test('property-card__tab active state uses --color-accent', () => {
    const block = extractBlock('.property-card__tab.is-active');
    assert.ok(block.includes('var(--color-accent)'), 'active tab must use var(--color-accent)');
});
```

- [ ] **Step 2: Run tests — expect 4 failures**

```bash
node --test tests/css-rules.test.js
```

Expected: `property-card__unit-img is invisible by default via opacity` FAIL, `property-card__unit-img.is-active is fully visible` FAIL, `property-card__tabs is flow-level with margin-bottom` FAIL, `property-card__tab inactive state has transparent bg with border` FAIL. The min-height and active-accent tests should still PASS.

- [ ] **Step 3: Replace the unit-img / tabs / tab block in `assets/css/style.css`**

Find this block (currently at lines 491–534):

```css
.property-card__unit-img {
    position: absolute;
    inset: 0;
}

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
    background: rgba(44, 37, 32, 0.72);  /* fallback for browsers without color-mix */
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
    background: rgba(44, 37, 32, 0.9);   /* fallback */
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

Replace with:

```css
.property-card__unit-img {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
}

.property-card__unit-img.is-active {
    opacity: 1;
    pointer-events: auto;
}

@media (prefers-reduced-motion: no-preference) {
    .property-card__unit-img {
        transition: opacity 0.3s ease;
    }
}

.property-card__tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
}

.property-card__tab {
    padding: 4px 14px;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 0.813rem;
    font-weight: 600;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: background var(--transition), color var(--transition);
    -webkit-tap-highlight-color: transparent;
}

.property-card__tab:hover {
    background: var(--color-surface);
    color: var(--color-text);
}

.property-card__tab.is-active {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
}

.property-card__tab:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}
```

- [ ] **Step 4: Run tests — expect all 6 to pass**

```bash
node --test tests/css-rules.test.js
```

Expected: `▶ 6 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add tests/css-rules.test.js assets/css/style.css
git commit -m "Use opacity crossfade for unit images, move tabs to card body in CSS"
```

---

## Task 2: Update toggle.js logic and its tests

**Files:**
- Modify: `tests/toggle.test.js`
- Modify: `assets/js/toggle.js`

- [ ] **Step 1: Update `tests/toggle.test.js`**

Replace the entire file. The `makeCard()` factory changes to match the new HTML shape (1br img has `is-active`, no `hidden`; tabs in the body). Image-visibility assertions change from `.hidden` to `.classList.contains('is-active')`.

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function makeCard() {
    const dom = new JSDOM(`
        <article class="property-card property-card--tabbed">
            <div class="property-card__image">
                <img class="property-card__unit-img is-active" data-unit="1br" src="1br.jpg">
                <img class="property-card__unit-img" data-unit="2br" src="2br.jpg">
            </div>
            <div class="property-card__body">
                <div class="property-card__tabs" role="tablist">
                    <button class="property-card__tab is-active" role="tab"
                            aria-selected="true" aria-controls="panel-1br"
                            data-unit="1br" tabindex="0">1 BR</button>
                    <button class="property-card__tab" role="tab"
                            aria-selected="false" aria-controls="panel-2br"
                            data-unit="2br" tabindex="-1">2 BR</button>
                </div>
                <div role="tabpanel" id="panel-1br" data-unit="1br">
                    <div class="property-card__specs" data-unit="1br">1BR specs</div>
                    <div class="property-card__rating" data-unit="1br">1BR rating</div>
                    <a class="property-card__cta" data-unit="1br" href="/1br">View 1BR</a>
                </div>
                <div role="tabpanel" id="panel-2br" data-unit="2br" hidden>
                    <div class="property-card__specs" data-unit="2br">2BR specs</div>
                    <div class="property-card__rating" data-unit="2br">2BR rating</div>
                    <a class="property-card__cta" data-unit="2br" href="/2br">View 2BR</a>
                </div>
            </div>
        </article>
    `);
    return { dom, card: dom.window.document.querySelector('.property-card--tabbed') };
}

test('1BR image has is-active, 2BR image lacks it by default', () => {
    const { card } = makeCard();
    assert.ok(card.querySelector('img[data-unit="1br"]').classList.contains('is-active'), '1br img must have is-active');
    assert.ok(!card.querySelector('img[data-unit="2br"]').classList.contains('is-active'), '2br img must lack is-active');
    assert.equal(card.querySelector('[role="tabpanel"][data-unit="1br"]').hidden, false);
    assert.equal(card.querySelector('[role="tabpanel"][data-unit="2br"]').hidden, true);
});

test('clicking 2BR tab shows 2br panel and hides 1br panel', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card);

    card.querySelector('[data-unit="2br"].property-card__tab').click();

    assert.ok(card.querySelector('img[data-unit="2br"]').classList.contains('is-active'), '2br img must have is-active');
    assert.ok(!card.querySelector('img[data-unit="1br"]').classList.contains('is-active'), '1br img must lack is-active');
    assert.equal(card.querySelector('[role="tabpanel"][data-unit="2br"]').hidden, false, '2br panel visible');
    assert.equal(card.querySelector('[role="tabpanel"][data-unit="1br"]').hidden, true, '1br panel hidden');
});

test('clicking 2BR sets is-active and aria-selected correctly', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card);

    card.querySelector('[data-unit="2br"].property-card__tab').click();

    const tab1 = card.querySelector('[data-unit="1br"].property-card__tab');
    const tab2 = card.querySelector('[data-unit="2br"].property-card__tab');
    assert.ok(tab2.classList.contains('is-active'), '2br tab is-active');
    assert.ok(!tab1.classList.contains('is-active'), '1br tab not is-active');
    assert.equal(tab2.getAttribute('aria-selected'), 'true');
    assert.equal(tab1.getAttribute('aria-selected'), 'false');
});

test('clicking 2BR gives 2br tab tabindex=0, 1br tabindex=-1 (roving tabindex)', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card);

    card.querySelector('[data-unit="2br"].property-card__tab').click();

    assert.equal(card.querySelector('[data-unit="2br"].property-card__tab').getAttribute('tabindex'), '0');
    assert.equal(card.querySelector('[data-unit="1br"].property-card__tab').getAttribute('tabindex'), '-1');
});

test('ArrowRight key on 1br tab activates 2br tab', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card);

    const tab1 = card.querySelector('[data-unit="1br"].property-card__tab');
    tab1.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    assert.ok(card.querySelector('[data-unit="2br"].property-card__tab').classList.contains('is-active'));
    assert.equal(card.querySelector('[role="tabpanel"][data-unit="2br"]').hidden, false);
});

test('ArrowLeft key on 2br tab activates 1br tab', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card);

    card.querySelector('[data-unit="2br"].property-card__tab').click();
    const tab2 = card.querySelector('[data-unit="2br"].property-card__tab');
    tab2.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

    assert.ok(card.querySelector('[data-unit="1br"].property-card__tab').classList.contains('is-active'));
    assert.equal(card.querySelector('[role="tabpanel"][data-unit="1br"]').hidden, false);
});

test('clicking back to 1BR restores 1br state', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card);

    card.querySelector('[data-unit="2br"].property-card__tab').click();
    card.querySelector('[data-unit="1br"].property-card__tab').click();

    assert.ok(card.querySelector('img[data-unit="1br"]').classList.contains('is-active'), '1br img has is-active');
    assert.ok(!card.querySelector('img[data-unit="2br"]').classList.contains('is-active'), '2br img lacks is-active');
    assert.equal(card.querySelector('[role="tabpanel"][data-unit="1br"]').hidden, false);
});

test('clicking 2BR hides inner specs, rating, and CTA of 1br panel', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card);

    card.querySelector('[data-unit="2br"].property-card__tab').click();

    assert.equal(card.querySelector('.property-card__specs[data-unit="1br"]').hidden, true, '1br specs hidden');
    assert.equal(card.querySelector('.property-card__rating[data-unit="1br"]').hidden, true, '1br rating hidden');
    assert.equal(card.querySelector('.property-card__cta[data-unit="1br"]').hidden, true, '1br CTA hidden');
    assert.equal(card.querySelector('.property-card__specs[data-unit="2br"]').hidden, false, '2br specs visible');
    assert.equal(card.querySelector('.property-card__rating[data-unit="2br"]').hidden, false, '2br rating visible');
    assert.equal(card.querySelector('.property-card__cta[data-unit="2br"]').hidden, false, '2br CTA visible');
});
```

- [ ] **Step 2: Run tests — expect 2 failures**

```bash
node --test tests/toggle.test.js
```

Expected FAIL: `clicking 2BR tab shows 2br panel and hides 1br panel` and `clicking back to 1BR restores 1br state` — both fail because old toggle.js doesn't toggle `is-active` on images. The initial-state test and the 5 other behavioral tests should still pass.

- [ ] **Step 3: Replace `activate()` in `assets/js/toggle.js`**

Replace the entire file:

```js
'use strict';

function initToggle(card) {
    var tabs = Array.prototype.slice.call(card.querySelectorAll('.property-card__tab'));

    function activate(unit) {
        // Update tabs
        tabs.forEach(function (tab) {
            var isActive = tab.getAttribute('data-unit') === unit;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Images: toggle is-active class (opacity crossfade, avoids hidden-on-absolute issues)
        var imgs = card.querySelectorAll('.property-card__unit-img');
        for (var i = 0; i < imgs.length; i++) {
            imgs[i].classList.toggle('is-active', imgs[i].getAttribute('data-unit') === unit);
        }

        // Body content: toggle hidden attribute (reliable for flow elements)
        var bodyEls = card.querySelectorAll('[data-unit]:not(.property-card__tab):not(.property-card__unit-img)');
        for (var k = 0; k < bodyEls.length; k++) {
            bodyEls[k].hidden = bodyEls[k].getAttribute('data-unit') !== unit;
        }
    }

    tabs.forEach(function (tab, idx) {
        tab.addEventListener('click', function () {
            activate(tab.getAttribute('data-unit'));
        });

        tab.addEventListener('keydown', function (e) {
            var next;
            if (e.key === 'ArrowRight') {
                next = tabs[(idx + 1) % tabs.length];
            } else if (e.key === 'ArrowLeft') {
                next = tabs[(idx - 1 + tabs.length) % tabs.length];
            } else {
                return;
            }
            e.preventDefault();
            activate(next.getAttribute('data-unit'));
            next.focus();
        });
    });
}

if (typeof module !== 'undefined') {
    module.exports = { initToggle: initToggle };
}
```

- [ ] **Step 4: Run tests — expect all 8 to pass**

```bash
node --test tests/toggle.test.js
```

Expected: `▶ 8 tests passed`.

- [ ] **Step 5: Run all tests to confirm no regressions**

```bash
npm test
```

Expected: All tests across `css-rules.test.js`, `toggle.test.js`, and `html-structure.test.js` pass.

- [ ] **Step 6: Commit**

```bash
git add tests/toggle.test.js assets/js/toggle.js
git commit -m "Switch image visibility to is-active class in toggle.js"
```

---

## Task 3: Update index.html

**Files:**
- Modify: `index.html:206-276`

- [ ] **Step 1: Update the Nugegoda card**

Find the Nugegoda `<article>` block (lines 206–276). Make these four changes:

**Change 1 — 1br img: add `is-active` class.**

Old:
```html
<img class="property-card__unit-img" data-unit="1br"
     src="assets/images/properties/nugegoda-1br.jpg"
     alt="Nugegoda — 1 Bedroom" loading="lazy" width="720" height="480">
```
New:
```html
<img class="property-card__unit-img is-active" data-unit="1br"
     src="assets/images/properties/nugegoda-1br.jpg"
     alt="Nugegoda — 1 Bedroom" loading="lazy" width="720" height="480">
```

**Change 2 — 2br img: remove `hidden` attribute.**

Old:
```html
<img class="property-card__unit-img" data-unit="2br"
     src="assets/images/properties/nugegoda-2br.jpg"
     alt="Nugegoda — 2 Bedrooms" loading="lazy" width="720" height="480"
     hidden>
```
New:
```html
<img class="property-card__unit-img" data-unit="2br"
     src="assets/images/properties/nugegoda-2br.jpg"
     alt="Nugegoda — 2 Bedrooms" loading="lazy" width="720" height="480">
```

**Change 3 — Move `<div class="property-card__tabs">` out of the image div and into the body, between `<h3>` and `<p class="property-card__location">`.**

The `property-card__image` div should end up containing only the two `<img>` elements (no tabs div). The `property-card__body` div should open as:

```html
<div class="property-card__body">
    <h3 class="property-card__name">Nugegoda Residence</h3>
    <div class="property-card__tabs" role="tablist" aria-label="Select room type">
        <button class="property-card__tab is-active" role="tab"
                aria-selected="true" aria-controls="nugegoda-panel-1br"
                data-unit="1br">1 BR</button>
        <button class="property-card__tab" role="tab"
                aria-selected="false" aria-controls="nugegoda-panel-2br"
                data-unit="2br">2 BR</button>
    </div>
    <p class="property-card__location">
```

**Change 4 — Remove redundant `hidden` from inner 2br elements** (they are already hidden because their parent tabpanel has `hidden`).

Old:
```html
<div role="tabpanel" id="nugegoda-panel-2br" data-unit="2br" hidden>
    <div class="property-card__specs" data-unit="2br" hidden>
    ...
    <div class="property-card__rating" data-unit="2br" hidden>
    ...
    <a href="..." data-unit="2br" hidden>
```
New:
```html
<div role="tabpanel" id="nugegoda-panel-2br" data-unit="2br" hidden>
    <div class="property-card__specs" data-unit="2br">
    ...
    <div class="property-card__rating" data-unit="2br">
    ...
    <a href="..." data-unit="2br">
```

The full resulting Nugegoda article should look like:

```html
<!-- Nugegoda · 1 BR / 2 BR toggle -->
<article class="property-card property-card--tabbed">
    <div class="property-card__image">
        <img class="property-card__unit-img is-active" data-unit="1br"
             src="assets/images/properties/nugegoda-1br.jpg"
             alt="Nugegoda — 1 Bedroom" loading="lazy" width="720" height="480">
        <img class="property-card__unit-img" data-unit="2br"
             src="assets/images/properties/nugegoda-2br.jpg"
             alt="Nugegoda — 2 Bedrooms" loading="lazy" width="720" height="480">
    </div>
    <div class="property-card__body">
        <h3 class="property-card__name">Nugegoda Residence</h3>
        <div class="property-card__tabs" role="tablist" aria-label="Select room type">
            <button class="property-card__tab is-active" role="tab"
                    aria-selected="true" aria-controls="nugegoda-panel-1br"
                    data-unit="1br">1 BR</button>
            <button class="property-card__tab" role="tab"
                    aria-selected="false" aria-controls="nugegoda-panel-2br"
                    data-unit="2br">2 BR</button>
        </div>
        <p class="property-card__location">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5Z" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="6" r="1.5" stroke="currentColor" stroke-width="1.2"/></svg>
            Jumbugasmulla Rd, Nugegoda
        </p>
        <div role="tabpanel" id="nugegoda-panel-1br" data-unit="1br">
            <div class="property-card__specs" data-unit="1br">
                <span>2 Beds &middot; 4 Guests</span>
                <span>1 Bedroom</span>
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
            <a href="https://airbnb.com/h/nugegoda-king-room" target="_blank"
               rel="noopener noreferrer" class="btn btn--primary property-card__cta"
               data-unit="1br">
                View on Airbnb
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 11L11 3M11 3H5M11 3v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="sr-only">(opens in new tab)</span>
            </a>
        </div>
        <div role="tabpanel" id="nugegoda-panel-2br" data-unit="2br" hidden>
            <div class="property-card__specs" data-unit="2br">
                <span>3 Beds &middot; 6 Guests</span>
                <span>2 Bedrooms</span>
                <span>2 Bathrooms</span>
                <span>Workspace</span>
                <span>Kitchen &amp; Dining</span>
                <span>Living &amp; TV Area</span>
                <span>4G WiFi</span>
            </div>
            <div class="property-card__rating" data-unit="2br">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#D4A843" aria-hidden="true"><path d="M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1Z"/></svg>
                <span>5.0</span>
                <span class="property-card__review-count">(2 reviews)</span>
            </div>
            <a href="https://airbnb.com/h/nugegoda-residence" target="_blank"
               rel="noopener noreferrer" class="btn btn--primary property-card__cta"
               data-unit="2br">
                View on Airbnb
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 11L11 3M11 3H5M11 3v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="sr-only">(opens in new tab)</span>
            </a>
        </div>
    </div>
</article>
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass (css-rules × 6, toggle × 8, html-structure × 6 = 20 total).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Move unit tabs into card body and fix image visibility in Nugegoda card"
```
