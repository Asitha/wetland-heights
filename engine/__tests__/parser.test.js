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
        if (check === 'contains') {
          assert.ok(result.html.includes(value), `Expected HTML to contain "${value}"`);
        } else if (check === 'notContains') {
          assert.ok(!result.html.includes(value), `Expected HTML NOT to contain "${value}"`);
        }
      }
    });
  }

  // ── Inline markdown rendering inside callouts ──────────

  const calloutMarkdownCases = [
    {
      name: 'bold in callout list items renders as <strong>',
      input: '> [!warn] Warning\n> - **Do not** force the door\n> - Avoid **overloading**',
      assertions: [
        { check: 'contains', value: '<strong>Do not</strong>' },
        { check: 'contains', value: '<strong>overloading</strong>' },
        { check: 'notContains', value: '**Do not**' },
      ],
    },
    {
      name: 'italic in callout list items renders as <em>',
      input: '> [!tip] Tips\n> - Use *gentle* cycle\n> - Add *small* amounts',
      assertions: [
        { check: 'contains', value: '<em>gentle</em>' },
        { check: 'notContains', value: '*gentle*' },
      ],
    },
    {
      name: 'bold in non-list callout body renders as <strong>',
      input: '> [!tip] Note\n> Always use **cold water** for dark fabrics.',
      assertions: [
        { check: 'contains', value: '<strong>cold water</strong>' },
        { check: 'notContains', value: '**cold water**' },
      ],
    },
    {
      name: 'link in callout body renders as <a>',
      input: '> [!tip] Reference\n> See [the guide](https://example.com) for more.',
      assertions: [
        { check: 'contains', value: 'href="https://example.com"' },
      ],
    },
  ];

  for (const { name, input, assertions } of calloutMarkdownCases) {
    test(name, () => {
      const result = parseContent(`---\ntitle: Test\n---\n${input}`);
      for (const { check, value } of assertions) {
        if (check === 'contains') {
          assert.ok(result.html.includes(value), `Expected HTML to contain "${value}"`);
        } else if (check === 'notContains') {
          assert.ok(!result.html.includes(value), `Expected HTML NOT to contain "${value}"`);
        }
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
    {
      name: 'bold in step body renders as <strong>',
      input: '## 1. Load\n\nUse **cold water** for darks.',
      assertions: [
        { check: 'contains', value: '<strong>cold water</strong>' },
        { check: 'notContains', value: '**cold water**' },
      ],
    },
  ];

  for (const { name, input, assertions } of stepCases) {
    test(name, () => {
      const result = parseContent(`---\ntitle: Test\n---\n${input}`);
      for (const { check, value } of assertions) {
        if (check === 'contains') {
          assert.ok(result.html.includes(value), `Expected HTML to contain "${value}"`);
        } else if (check === 'notContains') {
          assert.ok(!result.html.includes(value), `Expected HTML NOT to contain "${value}"`);
        }
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

  test('section card after last step is NOT nested inside the step', () => {
    const input = '## 1. First\n\nStep body.\n\n:::section ☀️ Drying\nRack available.\n:::';
    const result = parseContent(`---\ntitle: Test\n---\n${input}`);
    // The section div should NOT be inside the step div
    const stepEnd = result.html.indexOf('</div>\n</div>'); // end of step card
    const sectionStart = result.html.indexOf('<div class="section">');
    assert.ok(sectionStart > stepEnd, 'Section card should appear after step card closes');
  });

  test('callout after last step is NOT nested inside the step', () => {
    const input = '## 1. First\n\nStep body.\n\n> [!tip] Keep Fresh\n> - Wipe the seal.';
    const result = parseContent(`---\ntitle: Test\n---\n${input}`);
    const stepEnd = result.html.indexOf('</div>\n</div>');
    const calloutStart = result.html.indexOf('<div class="callout');
    assert.ok(calloutStart > stepEnd, 'Callout should appear after step card closes');
  });

  test('details after last step is NOT nested inside the step', () => {
    const input = '## 1. First\n\nStep body.\n\n:::details More Info\nExtra details.\n:::';
    const result = parseContent(`---\ntitle: Test\n---\n${input}`);
    const stepEnd = result.html.indexOf('</div>\n</div>');
    const detailsStart = result.html.indexOf('<details class="details">');
    assert.ok(detailsStart > stepEnd, 'Details should appear after step card closes');
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
