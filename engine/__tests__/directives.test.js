const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const { processDirectives } = require('../lib/directives');

// ── :::section directive ───────────────────────────────────

describe(':::section directive', () => {
  const cases = [
    {
      name: 'basic section with icon and title',
      input: ':::section ☀️ Drying\nA drying rack is available.\n:::',
      assertions: [
        { check: 'contains', value: '<div class="section">' },
        { check: 'contains', value: '<h3 class="section__title">' },
        { check: 'contains', value: '☀️' },
        { check: 'contains', value: 'Drying' },
        { check: 'contains', value: 'A drying rack is available.' },
      ],
    },
    {
      name: 'section with multi-line content',
      input: ':::section 🔑 Check-in\nLine one.\nLine two.\n:::',
      assertions: [
        { check: 'contains', value: 'Check-in' },
        { check: 'contains', value: 'Line one.' },
        { check: 'contains', value: 'Line two.' },
      ],
    },
    {
      name: 'section without icon',
      input: ':::section Drying\nContent here.\n:::',
      assertions: [
        { check: 'contains', value: 'Drying' },
        { check: 'contains', value: 'Content here.' },
      ],
    },
  ];

  for (const { name, input, assertions } of cases) {
    test(name, () => {
      const result = processDirectives(input);
      for (const { check, value } of assertions) {
        assert.ok(result.includes(value), `Expected output to contain "${value}"`);
      }
    });
  }

  test('does not contain raw ::: markers in output', () => {
    const input = ':::section ☀️ Drying\nContent.\n:::';
    const result = processDirectives(input);
    assert.ok(!result.includes(':::'), 'Output should not contain raw ::: markers');
  });
});

// ── :::cycles directive ────────────────────────────────────

describe(':::cycles directive', () => {
  const cases = [
    {
      name: 'renders cycle tags from list items',
      input: ':::cycles\n- **Quick 30** — ~30 min\n- **Mixed Fabric** — everyday\n- **Cotton** — towels & sheets\n:::',
      assertions: [
        { check: 'contains', value: '<div class="cycles">' },
        { check: 'contains', value: '<span class="cycle-tag">' },
        { check: 'contains', value: 'Quick 30' },
        { check: 'contains', value: 'Mixed Fabric' },
        { check: 'contains', value: 'Cotton' },
      ],
    },
    {
      name: 'handles single cycle item',
      input: ':::cycles\n- **Eco** — saves water\n:::',
      assertions: [
        { check: 'contains', value: 'Eco' },
        { check: 'contains', value: 'saves water' },
      ],
    },
  ];

  for (const { name, input, assertions } of cases) {
    test(name, () => {
      const result = processDirectives(input);
      for (const { check, value } of assertions) {
        assert.ok(result.includes(value), `Expected output to contain "${value}"`);
      }
    });
  }

  test('does not contain raw ::: markers in output', () => {
    const input = ':::cycles\n- **Quick** — fast\n:::';
    const result = processDirectives(input);
    assert.ok(!result.includes(':::'), 'Output should not contain raw ::: markers');
  });
});

// ── :::drawer-table directive ──────────────────────────────

describe(':::drawer-table directive', () => {
  const cases = [
    {
      name: 'renders a table with colored headers',
      input: ':::drawer-table\n| LEFT (Large) :: Main Wash | BACK RIGHT (Blue) :: Fabric Softener | FRONT RIGHT :: Pre-Wash / Bleach |\n|---|---|---|\n| Pour detergent here. | Small amount of softener | You probably won\'t need this |\n:::',
      assertions: [
        { check: 'contains', value: '<table class="drawer-table">' },
        { check: 'contains', value: '<th>' },
        { check: 'contains', value: 'LEFT (Large)' },
        { check: 'contains', value: 'Main Wash' },
        { check: 'contains', value: '<small>' },
        { check: 'contains', value: '<td>' },
        { check: 'contains', value: 'Pour detergent here.' },
      ],
    },
    {
      name: 'handles multiple body rows',
      input: ':::drawer-table\n| A :: Sub A | B :: Sub B |\n|---|---|\n| Row 1 A | Row 1 B |\n| Row 2 A | Row 2 B |\n:::',
      assertions: [
        { check: 'contains', value: 'Row 1 A' },
        { check: 'contains', value: 'Row 2 A' },
        { check: 'contains', value: 'Row 2 B' },
      ],
    },
  ];

  for (const { name, input, assertions } of cases) {
    test(name, () => {
      const result = processDirectives(input);
      for (const { check, value } of assertions) {
        assert.ok(result.includes(value), `Expected output to contain "${value}"`);
      }
    });
  }

  test('does not contain raw ::: markers in output', () => {
    const input = ':::drawer-table\n| A :: B |\n|---|\n| C |\n:::';
    const result = processDirectives(input);
    assert.ok(!result.includes(':::'), 'Output should not contain raw ::: markers');
  });
});

// ── passthrough ────────────────────────────────────────────

describe('passthrough', () => {
  const cases = [
    {
      name: 'plain text passes through unchanged',
      input: 'Hello world',
      expected: 'Hello world',
    },
    {
      name: 'markdown without directives passes through',
      input: '## Title\n\nSome paragraph.\n\n- Item 1\n- Item 2',
      expected: '## Title\n\nSome paragraph.\n\n- Item 1\n- Item 2',
    },
  ];

  for (const { name, input, expected } of cases) {
    test(name, () => {
      const result = processDirectives(input);
      assert.equal(result, expected);
    });
  }
});

// ── mixed content ──────────────────────────────────────────

describe('mixed content', () => {
  test('processes directives while preserving surrounding markdown', () => {
    const input = 'Before content.\n\n:::section ☀️ Drying\nRack available.\n:::\n\nAfter content.';
    const result = processDirectives(input);
    assert.ok(result.includes('Before content.'), 'Should preserve text before directive');
    assert.ok(result.includes('After content.'), 'Should preserve text after directive');
    assert.ok(result.includes('<div class="section">'), 'Should process directive');
    assert.ok(!result.includes(':::'), 'Should remove ::: markers');
  });

  test('processes multiple directives in sequence', () => {
    const input = ':::section 🔑 Check-in\nFirst.\n:::\n\n:::section 🏠 House Rules\nSecond.\n:::';
    const result = processDirectives(input);
    assert.ok(result.includes('Check-in'), 'Should process first directive');
    assert.ok(result.includes('House Rules'), 'Should process second directive');
    const sectionCount = (result.match(/<div class="section">/g) || []).length;
    assert.equal(sectionCount, 2, 'Should produce two section cards');
  });
});
