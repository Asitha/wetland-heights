const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

// Will be implemented in lib/theme.js
const { generateCSS, loadTheme } = require('../lib/theme');

// ── loadTheme ──────────────────────────────────────────────

describe('loadTheme', () => {
  test('loads and returns a valid theme object from a JSON file path', () => {
    const theme = loadTheme(require('path').join(__dirname, '..', 'themes', 'wetland-heights.json'));
    assert.equal(theme.name, 'wetland-heights');
    assert.ok(theme.colors);
    assert.ok(theme.fonts);
    assert.ok(theme.layout);
  });

  test('throws if file does not exist', () => {
    assert.throws(() => loadTheme('/nonexistent/theme.json'), /ENOENT|Cannot find/);
  });

  const requiredFields = [
    { field: 'colors', path: 'colors' },
    { field: 'fonts', path: 'fonts' },
    { field: 'layout', path: 'layout' },
  ];

  for (const { field, path } of requiredFields) {
    test(`throws if theme is missing required field: ${field}`, () => {
      const theme = { name: 'test', colors: {}, fonts: {}, layout: {} };
      delete theme[path];
      assert.throws(() => loadTheme(null, theme), new RegExp(field));
    });
  }
});

// ── generateCSS ────────────────────────────────────────────

describe('generateCSS', () => {
  let theme;

  // Load the real theme once for all tests
  test('setup', () => {
    theme = loadTheme(require('path').join(__dirname, '..', 'themes', 'wetland-heights.json'));
  });

  // Data-provider: theme color values should appear in the CSS
  const colorCases = [
    { name: 'body background color', expected: '#F8F5F1' },
    { name: 'body text color', expected: '#2C2520' },
    { name: 'accent color (step badge)', expected: '#8C6338' },
    { name: 'border color', expected: '#E5E0DA' },
    { name: 'muted text color', expected: '#6B5E56' },
    { name: 'secondary text color', expected: '#4a3f39' },
    { name: 'header gradient', expected: 'linear-gradient(135deg, #4D7370' },
    { name: 'header bar color', expected: '#8C6338' },
    { name: 'pod callout background', expected: '#FFF8E1' },
    { name: 'pod callout border', expected: '#D4A843' },
    { name: 'tip callout background', expected: '#EDF5F4' },
    { name: 'tip callout border', expected: '#8EB4B1' },
    { name: 'warn callout background', expected: '#FDF0EE' },
    { name: 'warn callout border', expected: '#C0564A' },
  ];

  for (const { name, expected } of colorCases) {
    test(`CSS contains ${name}: ${expected}`, () => {
      const css = generateCSS(theme);
      assert.ok(css.includes(expected), `Expected CSS to contain "${expected}" for ${name}`);
    });
  }

  // Data-provider: font values should appear in CSS
  const fontCases = [
    { name: 'body font family', expected: "'Inter'" },
    { name: 'heading font family', expected: "'Fraunces'" },
  ];

  for (const { name, expected } of fontCases) {
    test(`CSS contains ${name}: ${expected}`, () => {
      const css = generateCSS(theme);
      assert.ok(css.includes(expected), `Expected CSS to contain "${expected}" for ${name}`);
    });
  }

  // Data-provider: layout values should appear in CSS
  const layoutCases = [
    { name: 'max width', expected: '600px' },
    { name: 'card border radius', expected: '12px' },
    { name: 'badge border radius', expected: '10px' },
    { name: 'callout border radius', expected: '10px' },
  ];

  for (const { name, expected } of layoutCases) {
    test(`CSS contains ${name}: ${expected}`, () => {
      const css = generateCSS(theme);
      assert.ok(css.includes(expected), `Expected CSS to contain "${expected}" for ${name}`);
    });
  }

  // Data-provider: CSS must include all required component selectors
  const selectorCases = [
    { name: 'reset', selector: 'box-sizing: border-box' },
    { name: 'body', selector: 'body' },
    { name: 'page container', selector: '.page' },
    { name: 'header', selector: '.header' },
    { name: 'header accent bar', selector: '.header::after' },
    { name: 'header icon', selector: '.header__icon' },
    { name: 'header title', selector: '.header__title' },
    { name: 'header subtitle', selector: '.header__subtitle' },
    { name: 'step container', selector: '.step' },
    { name: 'step number badge', selector: '.step__number' },
    { name: 'step content', selector: '.step__content' },
    { name: 'step title', selector: '.step__title' },
    { name: 'step text', selector: '.step__text' },
    { name: 'callout base', selector: '.callout' },
    { name: 'callout pod variant', selector: '.callout--pod' },
    { name: 'callout tip variant', selector: '.callout--tip' },
    { name: 'callout warn variant', selector: '.callout--warn' },
    { name: 'callout title', selector: '.callout__title' },
    { name: 'section card', selector: '.section' },
    { name: 'section title', selector: '.section__title' },
    { name: 'cycle tags container', selector: '.cycles' },
    { name: 'cycle tag', selector: '.cycle-tag' },
    { name: 'dont list', selector: '.dont-list' },
    { name: 'care list', selector: '.care-list' },
    { name: 'footer', selector: '.footer' },
    { name: 'details element', selector: '.details' },
    { name: 'details summary', selector: '.details__summary' },
    { name: 'details content', selector: '.details__content' },
  ];

  for (const { name, selector } of selectorCases) {
    test(`CSS includes selector for ${name}: ${selector}`, () => {
      const css = generateCSS(theme);
      assert.ok(css.includes(selector), `Expected CSS to contain selector "${selector}" for ${name}`);
    });
  }

  // When a different theme is provided, CSS values should change
  test('uses custom theme colors when provided', () => {
    const customTheme = JSON.parse(JSON.stringify(theme));
    customTheme.colors.bg = '#000000';
    customTheme.colors.text = '#FFFFFF';
    const css = generateCSS(customTheme);
    assert.ok(css.includes('#000000'), 'Expected custom bg color');
    assert.ok(css.includes('#FFFFFF'), 'Expected custom text color');
    assert.ok(!css.includes('#F8F5F1'), 'Should not contain original bg color');
  });

  test('returns a string', () => {
    const css = generateCSS(theme);
    assert.equal(typeof css, 'string');
  });

  test('CSS is non-empty', () => {
    const css = generateCSS(theme);
    assert.ok(css.length > 100, 'CSS should be substantial');
  });
});
