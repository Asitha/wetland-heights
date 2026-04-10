const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const { render } = require('../lib/renderer');

// ── HTML document structure ────────────────────────────────

describe('render produces valid HTML document', () => {
  const meta = { title: 'Test Guide', subtitle: 'Unit 6E', icon: '🧺', noindex: true };
  const content = '<p>Hello world.</p>';
  const css = 'body { color: red; }';

  const structureCases = [
    { name: 'DOCTYPE', expected: '<!DOCTYPE html>' },
    { name: 'html lang attribute', expected: '<html lang="en">' },
    { name: 'meta charset', expected: '<meta charset="UTF-8">' },
    { name: 'meta viewport', expected: 'width=device-width, initial-scale=1.0' },
    { name: 'closing html tag', expected: '</html>' },
    { name: 'closing body tag', expected: '</body>' },
  ];

  for (const { name, expected } of structureCases) {
    test(`includes ${name}`, () => {
      const html = render({ meta, content, css });
      assert.ok(html.includes(expected), `Expected output to contain "${expected}"`);
    });
  }
});

// ── Meta injection ─────────────────────────────────────────

describe('meta injection', () => {
  const content = '<p>Body.</p>';
  const css = 'body {}';

  const metaCases = [
    {
      name: 'title in <title> tag',
      meta: { title: 'Laundry Guide', subtitle: 'Unit 6E' },
      expected: '<title>Laundry Guide',
    },
    {
      name: 'icon in header',
      meta: { title: 'Guide', icon: '🧺' },
      expected: '🧺',
    },
    {
      name: 'subtitle in header',
      meta: { title: 'Guide', subtitle: 'LG 8kg' },
      expected: 'LG 8kg',
    },
    {
      name: 'noindex meta tag when noindex is true',
      meta: { title: 'Guide', noindex: true },
      expected: 'noindex, nofollow',
    },
  ];

  for (const { name, meta, expected } of metaCases) {
    test(name, () => {
      const html = render({ meta, content, css });
      assert.ok(html.includes(expected), `Expected output to contain "${expected}"`);
    });
  }

  test('no noindex tag when noindex is false/absent', () => {
    const html = render({ meta: { title: 'Guide' }, content, css });
    assert.ok(!html.includes('noindex'), 'Should not include noindex when not set');
  });
});

// ── Content injection ──────────────────────────────────────

describe('content injection', () => {
  const meta = { title: 'Test' };
  const css = 'body {}';

  test('body content appears in output', () => {
    const html = render({ meta, content: '<p>Custom content here.</p>', css });
    assert.ok(html.includes('Custom content here.'), 'Content should be injected');
  });

  test('HTML in content is not escaped (rendered raw)', () => {
    const html = render({ meta, content: '<div class="step">Step HTML</div>', css });
    assert.ok(html.includes('<div class="step">Step HTML</div>'), 'HTML should not be escaped');
  });
});

// ── CSS injection ──────────────────────────────────────────

describe('CSS injection', () => {
  test('CSS appears inside <style> tag', () => {
    const css = '.header { background: red; }';
    const html = render({ meta: { title: 'Test' }, content: '<p>Body</p>', css });
    assert.ok(html.includes('<style>'), 'Should have <style> tag');
    assert.ok(html.includes(css), 'CSS should be injected');
    assert.ok(html.includes('</style>'), 'Should have closing </style> tag');
  });
});

// ── Header and footer structure ────────────────────────────

describe('header and footer', () => {
  const meta = { title: 'My Guide', subtitle: 'Sub', icon: '🧺' };
  const css = 'body {}';
  const content = '<p>Body.</p>';

  test('header contains title in h1', () => {
    const html = render({ meta, content, css });
    assert.ok(html.includes('<h1'), 'Should have h1 tag');
    assert.ok(html.includes('My Guide'), 'Should contain title text');
  });

  test('page wrapper div exists', () => {
    const html = render({ meta, content, css });
    assert.ok(html.includes('<div class="page">'), 'Should have page wrapper');
  });

  test('footer with link to home', () => {
    const html = render({ meta, content, css });
    assert.ok(html.includes('class="footer"'), 'Should have footer');
    assert.ok(html.includes('href="/"'), 'Footer should link to home');
  });
});

// ── Google Fonts link ──────────────────────────────────────

describe('Google Fonts', () => {
  test('includes Google Fonts link when fontsUrl provided', () => {
    const meta = { title: 'Test' };
    const css = 'body {}';
    const fontsUrl = 'https://fonts.googleapis.com/css2?family=Inter';
    const html = render({ meta, content: '<p>Body</p>', css, fontsUrl });
    assert.ok(html.includes(fontsUrl), 'Should include fonts URL');
    assert.ok(html.includes('fonts.googleapis.com'), 'Should link to Google Fonts');
  });
});

// ── Favicon ────────────────────────────────────────────────

describe('favicon', () => {
  test('includes favicon link', () => {
    const html = render({
      meta: { title: 'Test', faviconPath: '/assets/images/favicon.svg' },
      content: '<p>Body</p>',
      css: 'body {}',
    });
    assert.ok(html.includes('favicon.svg'), 'Should include favicon');
  });
});
