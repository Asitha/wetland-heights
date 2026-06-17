const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

test('Nugegoda Residence heading appears exactly once', () => {
    const matches = html.match(/Nugegoda Residence/g) || [];
    assert.equal(matches.length, 1, `expected 1 occurrence, got ${matches.length}`);
});

test('toggle card has property-card--tabbed class', () => {
    assert.ok(html.includes('property-card--tabbed'), 'missing property-card--tabbed');
});

test('data-unit="1br" is present', () => {
    assert.ok(html.includes('data-unit="1br"'), 'missing data-unit="1br"');
});

test('data-unit="2br" is present', () => {
    assert.ok(html.includes('data-unit="2br"'), 'missing data-unit="2br"');
});

test('first tab has aria-selected="true"', () => {
    assert.ok(html.includes('aria-selected="true"'), 'first tab must have aria-selected="true"');
});

test('exactly 3 property cards in the grid', () => {
    // Match opening article tags with property-card class (not property-card--tabbed or property-card--coming-soon alone)
    const cards = (html.match(/class="property-card[ "]/g) || []).length;
    assert.equal(cards, 3, `expected 3 property cards, got ${cards}`);
});
