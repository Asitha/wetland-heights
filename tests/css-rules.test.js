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
