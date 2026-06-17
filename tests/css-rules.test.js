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
