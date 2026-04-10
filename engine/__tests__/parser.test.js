const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const { parseContent } = require('../lib/parser');

// ── Frontmatter extraction ─────────────────────────────────

describe('frontmatter extraction', () => {
  const cases = [
    {
      name: 'extracts title from frontmatter',
      input: '---\ntitle: My Guide\n---\nBody text.',
      field: 'title',
      expected: 'My Guide',
    },
    {
      name: 'extracts subtitle',
      input: '---\ntitle: Guide\nsubtitle: "Sub"\n---\nBody.',
      field: 'subtitle',
      expected: 'Sub',
    },
    {
      name: 'extracts icon',
      input: '---\ntitle: Guide\nicon: "🧺"\n---\nBody.',
      field: 'icon',
      expected: '🧺',
    },
    {
      name: 'extracts noindex flag',
      input: '---\ntitle: Guide\nnoindex: true\n---\nBody.',
      field: 'noindex',
      expected: true,
    },
  ];

  for (const { name, input, field, expected } of cases) {
    test(name, () => {
      const result = parseContent(input);
      assert.equal(result.meta[field], expected);
    });
  }

  test('returns body HTML separately from meta', () => {
    const result = parseContent('---\ntitle: Guide\n---\nHello world.');
    assert.ok(result.meta);
    assert.ok(result.html);
    assert.ok(result.html.includes('Hello world'));
  });
});

// ── Callout rendering ──────────────────────────────────────

describe('callout rendering', () => {
  const calloutCases = [
    {
      name: 'tip callout',
      input: '> [!tip] Help Us\n> Keep it clean.',
      assertions: [
        { check: 'contains', value: 'callout--tip' },
        { check: 'contains', value: 'Help Us' },
        { check: 'contains', value: 'Keep it clean.' },
      ],
    },
    {
      name: 'warn callout',
      input: '> [!warn] Please Do Not\n> - Force the door open\n> - Overload the drum',
      assertions: [
        { check: 'contains', value: 'callout--warn' },
        { check: 'contains', value: 'Please Do Not' },
        { check: 'contains', value: 'Force the door open' },
        { check: 'contains', value: 'Overload the drum' },
      ],
    },
    {
      name: 'pod callout',
      input: '> [!pod] Using Pods?\n> Place the pod directly in the drum.',
      assertions: [
        { check: 'contains', value: 'callout--pod' },
        { check: 'contains', value: 'Using Pods?' },
        { check: 'contains', value: 'Place the pod directly in the drum.' },
      ],
    },
    {
      name: 'callout without title',
      input: '> [!tip]\n> Just a body.',
      assertions: [
        { check: 'contains', value: 'callout--tip' },
        { check: 'contains', value: 'Just a body.' },
      ],
    },
  ];

  for (const { name, input, assertions } of calloutCases) {
    test(name, () => {
      const result = parseContent(`---\ntitle: Test\n---\n${input}`);
      for (const { check, value } of assertions) {
        assert.ok(result.html.includes(value), `Expected HTML to contain "${value}"`);
      }
    });
  }

  test('warn callout uses dont-list class for lists', () => {
    const input = '> [!warn] Do Not\n> - Item one\n> - Item two';
    const result = parseContent(`---\ntitle: Test\n---\n${input}`);
    assert.ok(result.html.includes('dont-list'), 'Warn callout lists should use dont-list class');
  });

  test('tip callout uses care-list class for lists', () => {
    const input = '> [!tip] Tips\n> - Item one\n> - Item two';
    const result = parseContent(`---\ntitle: Test\n---\n${input}`);
    assert.ok(result.html.includes('care-list'), 'Tip callout lists should use care-list class');
  });

  test('regular blockquote without admonition passes through normally', () => {
    const input = '> Just a regular quote.';
    const result = parseContent(`---\ntitle: Test\n---\n${input}`);
    assert.ok(!result.html.includes('callout'), 'Regular blockquotes should not become callouts');
  });
});

// ── Step heading rendering ─────────────────────────────────

describe('step heading rendering', () => {
  const stepCases = [
    {
      name: 'single step heading',
      input: '## 1. Load Your Clothes\n\nOpen the door.',
      assertions: [
        { check: 'contains', value: '<div class="step">' },
        { check: 'contains', value: '<div class="step__number">1</div>' },
        { check: 'contains', value: 'Load Your Clothes' },
        { check: 'contains', value: 'Open the door.' },
      ],
    },
    {
      name: 'multiple step headings',
      input: '## 1. First Step\n\nFirst body.\n\n## 2. Second Step\n\nSecond body.',
      assertions: [
        { check: 'contains', value: '<div class="step__number">1</div>' },
        { check: 'contains', value: 'First Step' },
        { check: 'contains', value: '<div class="step__number">2</div>' },
        { check: 'contains', value: 'Second Step' },
      ],
    },
    {
      name: 'step with multi-paragraph body',
      input: '## 1. Load\n\nParagraph one.\n\nParagraph two.',
      assertions: [
        { check: 'contains', value: 'Paragraph one.' },
        { check: 'contains', value: 'Paragraph two.' },
      ],
    },
  ];

  for (const { name, input, assertions } of stepCases) {
    test(name, () => {
      const result = parseContent(`---\ntitle: Test\n---\n${input}`);
      for (const { check, value } of assertions) {
        assert.ok(result.html.includes(value), `Expected HTML to contain "${value}"`);
      }
    });
  }

  test('non-numbered heading is NOT wrapped as a step', () => {
    const input = '## Regular Heading\n\nContent.';
    const result = parseContent(`---\ntitle: Test\n---\n${input}`);
    assert.ok(!result.html.includes('step__number'), 'Non-numbered heading should not be a step');
  });

  test('step count matches number of numbered headings', () => {
    const input = '## 1. A\nBody.\n\n## 2. B\nBody.\n\n## 3. C\nBody.';
    const result = parseContent(`---\ntitle: Test\n---\n${input}`);
    const stepCount = (result.html.match(/<div class="step">/g) || []).length;
    assert.equal(stepCount, 3, 'Should produce 3 step cards');
  });
});

// ── Plain markdown passthrough ─────────────────────────────

describe('plain markdown passthrough', () => {
  const cases = [
    {
      name: 'bold text',
      input: 'This is **bold** text.',
      expected: '<strong>bold</strong>',
    },
    {
      name: 'italic text',
      input: 'This is *italic* text.',
      expected: '<em>italic</em>',
    },
    {
      name: 'unordered list',
      input: '- Item 1\n- Item 2',
      expected: '<li>Item 1</li>',
    },
    {
      name: 'paragraph',
      input: 'Simple paragraph.',
      expected: '<p>Simple paragraph.</p>',
    },
    {
      name: 'link',
      input: '[click here](https://example.com)',
      expected: 'href="https://example.com"',
    },
  ];

  for (const { name, input, expected } of cases) {
    test(name, () => {
      const result = parseContent(`---\ntitle: Test\n---\n${input}`);
      assert.ok(result.html.includes(expected), `Expected HTML to contain "${expected}"`);
    });
  }
});
