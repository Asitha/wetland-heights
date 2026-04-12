/**
 * Pre-processes custom :::directive blocks in markdown content.
 * Transforms them into HTML before the markdown parser runs.
 *
 * Supported directives:
 *   :::section ICON Title\n content \n:::
 *   :::cycles\n - items \n:::
 *   :::drawer-table\n table with :: subtitles \n:::
 */

const DIRECTIVE_RE = /^:::(\S+)(?: (.+))?\n([\s\S]*?)^:::/gm;

function processDirectives(input) {
  return input.replace(DIRECTIVE_RE, (match, type, args, body) => {
    switch (type) {
      case 'section':
        return renderSection(args || '', body.trim());
      case 'cycles':
        return renderCycles(body.trim());
      case 'drawer-table':
        return renderDrawerTable(body.trim());
      case 'details':
        return renderDetails(args || '', body.trim());
      default:
        return match; // unknown directive, leave as-is
    }
  });
}

function renderSection(args, body) {
  // args can be "ICON Title" or just "Title"
  // Emoji detection: first character might be an emoji (multi-byte)
  const emojiMatch = args.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s+/u);
  let icon = '';
  let title = args;

  if (emojiMatch) {
    icon = emojiMatch[1];
    title = args.slice(emojiMatch[0].length);
  }

  const iconHtml = icon ? `<span aria-hidden="true">${icon}</span> ` : '';

  return `<div class="section">
<h3 class="section__title">${iconHtml}${title}</h3>
<p class="step__text">${body}</p>
</div>`;
}

function renderCycles(body) {
  // Parse markdown list items: "- **Label** — desc"
  const items = body
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => {
      const content = line.replace(/^-\s*/, '');
      // Extract bold label and description
      const boldMatch = content.match(/\*\*(.+?)\*\*(.*)/);
      if (boldMatch) {
        const label = boldMatch[1];
        const desc = boldMatch[2].trim().replace(/^—\s*/, '— ');
        return `<span class="cycle-tag"><strong>${label}</strong> <span>${desc}</span></span>`;
      }
      return `<span class="cycle-tag">${content}</span>`;
    });

  return `<div class="cycles">\n${items.join('\n')}\n</div>`;
}

function renderDetails(title, body) {
  const { marked } = require('marked');
  const parsedBody = marked.parse(body);
  return `<details class="details">
<summary class="details__summary">${title}</summary>
<div class="details__content">
${parsedBody}
</div>
</details>`;
}

function renderDrawerTable(body) {
  const lines = body.split('\n').filter(l => l.trim());

  // First line: headers with :: subtitles
  // Format: | Header :: Subtitle | Header :: Subtitle |
  const headerLine = lines[0];
  const headers = headerLine
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
    .map(cell => {
      const parts = cell.split('::').map(s => s.trim());
      const title = parts[0];
      const subtitle = parts[1] || '';
      return { title, subtitle };
    });

  // Skip separator line (|---|---|)
  const bodyRows = lines.slice(2); // skip header + separator

  // Build HTML
  let html = '<table class="drawer-table">\n<thead>\n<tr>\n';
  for (const { title, subtitle } of headers) {
    html += `<th>${title}${subtitle ? `<small>${subtitle}</small>` : ''}</th>\n`;
  }
  html += '</tr>\n</thead>\n<tbody>\n';

  for (const row of bodyRows) {
    const cells = row.split('|').map(s => s.trim()).filter(s => s !== undefined);
    // Filter out empty strings from leading/trailing |
    const filteredCells = cells.filter((_, i) => i > 0 || cells[0] !== '').slice(0, headers.length);
    html += '<tr>\n';
    for (let i = 0; i < headers.length; i++) {
      const cellContent = (filteredCells[i] || '').trim();
      html += `<td>${cellContent}</td>\n`;
    }
    html += '</tr>\n';
  }

  html += '</tbody>\n</table>';
  return html;
}

module.exports = { processDirectives };
