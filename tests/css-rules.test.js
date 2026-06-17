const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const css = fs.readFileSync('assets/css/style.css', 'utf8');

// Extract just the .property-card__tab block (not __tabs, not __badge)
function extractBlock(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped + '\\s*\\{([^}]+)\\}');
    const m = css.match(re);
    return m ? m[1] : '';
}

test('property-card__tabs has position absolute top-right', () => {
    const block = extractBlock('.property-card__tabs');
    assert.ok(block.includes('position: absolute'), 'must be position absolute');
    assert.ok(block.includes('top: 12px'), 'must be 12px from top');
    assert.ok(block.includes('right: 12px'), 'must be 12px from right');
});

test('property-card__tab has min-height for mobile tap target', () => {
    const block = extractBlock('.property-card__tab');
    assert.ok(block.includes('min-height'), 'must have min-height');
    assert.ok(block.includes('36px'), 'min-height must be at least 36px');
});

test('property-card__tab active state uses --color-accent', () => {
    const block = extractBlock('.property-card__tab.is-active');
    assert.ok(block.includes('var(--color-accent)'), 'active tab must use var(--color-accent)');
});

test('property-card__tab has color-mix background with theme variable', () => {
    const block = extractBlock('.property-card__tab');
    assert.ok(
        block.includes('color-mix') && block.includes('var(--color-text)'),
        'tab background must use color-mix with var(--color-text)'
    );
});

test('property-card__tab has rgba fallback background', () => {
    const block = extractBlock('.property-card__tab');
    assert.ok(block.includes('rgba('), 'tab must have an rgba fallback background for older browsers');
});
