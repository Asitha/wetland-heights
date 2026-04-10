const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { buildFile, buildAll } = require('../lib/build');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const OUTPUT_DIR = path.join(__dirname, 'test-output');
const THEME_PATH = path.join(__dirname, '..', 'themes', 'wetland-heights.json');

// ── Setup / teardown ───────────────────────────────────────

function setup() {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function teardown() {
  fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}

// ── buildFile ──────────────────────────────────────────────

describe('buildFile', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  test('generates index.html from a markdown file', () => {
    const mdPath = path.join(FIXTURES_DIR, 'test-guide.md');
    fs.writeFileSync(mdPath, '---\ntitle: Test Guide\nsubtitle: Unit 6E\nicon: "🧺"\nnoindex: true\n---\n\nHello world.');

    const outDir = path.join(OUTPUT_DIR, 'test-guide');
    buildFile(mdPath, outDir, THEME_PATH);

    const outPath = path.join(outDir, 'index.html');
    assert.ok(fs.existsSync(outPath), 'index.html should be created');
  });

  // Data-provider: the generated HTML should contain key elements
  const contentCases = [
    { name: 'page title', md: '---\ntitle: Laundry Guide\n---\nBody.', expected: 'Laundry Guide' },
    { name: 'body content', md: '---\ntitle: T\n---\nHello world.', expected: 'Hello world.' },
    { name: 'noindex meta', md: '---\ntitle: T\nnoindex: true\n---\nBody.', expected: 'noindex, nofollow' },
    { name: 'theme CSS (bg color)', md: '---\ntitle: T\n---\nBody.', expected: '#F8F5F1' },
    { name: 'theme CSS (accent)', md: '---\ntitle: T\n---\nBody.', expected: '#8C6338' },
    { name: 'Google Fonts link', md: '---\ntitle: T\n---\nBody.', expected: 'fonts.googleapis.com' },
    { name: 'DOCTYPE', md: '---\ntitle: T\n---\nBody.', expected: '<!DOCTYPE html>' },
  ];

  for (const { name, md, expected } of contentCases) {
    test(`output contains ${name}`, () => {
      const mdPath = path.join(FIXTURES_DIR, 'case.md');
      fs.writeFileSync(mdPath, md);
      const outDir = path.join(OUTPUT_DIR, 'case');
      buildFile(mdPath, outDir, THEME_PATH);

      const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      assert.ok(html.includes(expected), `Expected output to contain "${expected}"`);
    });
  }

  test('step headings produce step cards', () => {
    const md = '---\ntitle: T\n---\n\n## 1. Load\n\nOpen the door.\n\n## 2. Wash\n\nPress start.';
    const mdPath = path.join(FIXTURES_DIR, 'steps.md');
    fs.writeFileSync(mdPath, md);
    const outDir = path.join(OUTPUT_DIR, 'steps');
    buildFile(mdPath, outDir, THEME_PATH);

    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    const stepCount = (html.match(/<div class="step__number">/g) || []).length;
    assert.equal(stepCount, 2, 'Should produce 2 step cards');
  });

  test('callouts render correctly', () => {
    const md = '---\ntitle: T\n---\n\n> [!tip] Keep Fresh\n> - Wipe the seal.';
    const mdPath = path.join(FIXTURES_DIR, 'callout.md');
    fs.writeFileSync(mdPath, md);
    const outDir = path.join(OUTPUT_DIR, 'callout');
    buildFile(mdPath, outDir, THEME_PATH);

    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    assert.ok(html.includes('callout--tip'), 'Should render tip callout');
    assert.ok(html.includes('Keep Fresh'), 'Should include callout title');
  });

  test('directives render correctly', () => {
    const md = '---\ntitle: T\n---\n\n:::section ☀️ Drying\nRack available.\n:::';
    const mdPath = path.join(FIXTURES_DIR, 'directive.md');
    fs.writeFileSync(mdPath, md);
    const outDir = path.join(OUTPUT_DIR, 'directive');
    buildFile(mdPath, outDir, THEME_PATH);

    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    assert.ok(html.includes('class="section"'), 'Should render section card');
    assert.ok(html.includes('Drying'), 'Should include section title');
  });
});

// ── buildAll ───────────────────────────────────────────────

describe('buildAll', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  test('builds all markdown files in a content directory', () => {
    // Create two content files mimicking the real structure
    const dir1 = path.join(FIXTURES_DIR, 'qr', '6e');
    fs.mkdirSync(dir1, { recursive: true });
    fs.writeFileSync(path.join(dir1, 'washing-machine.md'), '---\ntitle: Washer\n---\nWash guide.');
    fs.writeFileSync(path.join(dir1, 'induction-cooker.md'), '---\ntitle: Cooker\n---\nCook guide.');

    const results = buildAll(FIXTURES_DIR, OUTPUT_DIR, THEME_PATH);

    assert.equal(results.length, 2, 'Should build 2 files');
    assert.ok(fs.existsSync(path.join(OUTPUT_DIR, 'qr', '6e', 'washing-machine', 'index.html')));
    assert.ok(fs.existsSync(path.join(OUTPUT_DIR, 'qr', '6e', 'induction-cooker', 'index.html')));
  });

  test('returns empty array when no markdown files found', () => {
    const results = buildAll(FIXTURES_DIR, OUTPUT_DIR, THEME_PATH);
    assert.equal(results.length, 0);
  });
});
