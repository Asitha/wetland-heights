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
                            aria-selected="true" aria-controls="panel-1br"
                            data-unit="1br" tabindex="0">1 BR</button>
                    <button class="property-card__tab" role="tab"
                            aria-selected="false" aria-controls="panel-2br"
                            data-unit="2br" tabindex="-1">2 BR</button>
                </div>
            </div>
            <div class="property-card__body">
                <div role="tabpanel" id="panel-1br" data-unit="1br">
                    <div class="property-card__specs" data-unit="1br">1BR specs</div>
                    <div class="property-card__rating" data-unit="1br">1BR rating</div>
                    <a class="property-card__cta" data-unit="1br" href="/1br">View 1BR</a>
                </div>
                <div role="tabpanel" id="panel-2br" data-unit="2br" hidden>
                    <div class="property-card__specs" data-unit="2br" hidden>2BR specs</div>
                    <div class="property-card__rating" data-unit="2br" hidden>2BR rating</div>
                    <a class="property-card__cta" data-unit="2br" href="/2br" hidden>View 2BR</a>
                </div>
            </div>
        </article>
    `);
    return { dom, card: dom.window.document.querySelector('.property-card--tabbed') };
}

test('1BR elements are visible by default', () => {
    const { card } = makeCard();
    assert.equal(card.querySelector('img[data-unit="1br"]').hidden, false);
    assert.equal(card.querySelector('img[data-unit="2br"]').hidden, true);
    assert.equal(card.querySelector('[role="tabpanel"][data-unit="1br"]').hidden, false);
    assert.equal(card.querySelector('[role="tabpanel"][data-unit="2br"]').hidden, true);
});

test('clicking 2BR tab shows 2br panel and hides 1br panel', () => {
    const { dom, card } = makeCard();
    const { initToggle } = require('../assets/js/toggle.js');
    initToggle(card);

    card.querySelector('[data-unit="2br"].property-card__tab').click();

    assert.equal(card.querySelector('img[data-unit="2br"]').hidden, false, '2br img visible');
    assert.equal(card.querySelector('img[data-unit="1br"]').hidden, true, '1br img hidden');
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

    // First activate 2br
    card.querySelector('[data-unit="2br"].property-card__tab').click();
    // Then press ArrowLeft
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

    assert.equal(card.querySelector('img[data-unit="1br"]').hidden, false);
    assert.equal(card.querySelector('img[data-unit="2br"]').hidden, true);
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
