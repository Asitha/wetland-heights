const matter = require('gray-matter');
const { Marked } = require('marked');
const { processDirectives } = require('./directives');

/**
 * Parse a markdown string with frontmatter into { meta, html }.
 * Handles custom callout blocks and step-heading wrapping.
 */
function parseContent(input) {
  // 1. Extract frontmatter
  const { data: meta, content: rawBody } = matter(input);

  // 2. Pre-process custom :::directives
  const preprocessed = processDirectives(rawBody);

  // 3. Pre-process callout blockquotes before marked runs
  const withCallouts = preprocessCallouts(preprocessed);

  // 4. Parse markdown
  const marked = new Marked();
  let html = marked.parse(withCallouts);

  // 5. Post-process: wrap ## N. headings in step cards
  html = wrapStepHeadings(html);

  return { meta, html };
}

/**
 * Transform > [!type] Title blockquotes into callout HTML before marked parses them.
 * This avoids fighting with marked's blockquote renderer.
 */
function preprocessCallouts(input) {
  const lines = input.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    // Detect start of a callout blockquote: > [!type] optional title
    const startMatch = lines[i].match(/^>\s*\[!(\w+)\]\s*(.*)?$/);
    if (startMatch) {
      const type = startMatch[1];
      const title = (startMatch[2] || '').trim();
      const bodyLines = [];

      i++;
      // Collect continuation lines (lines starting with >)
      while (i < lines.length && lines[i].match(/^>/)) {
        bodyLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }

      const calloutHtml = renderCallout(type, title, bodyLines.join('\n'));
      output.push(calloutHtml);
    } else {
      output.push(lines[i]);
      i++;
    }
  }

  return output.join('\n');
}

/**
 * Render a callout block as HTML.
 */
function renderCallout(type, title, body) {
  const listClass = type === 'warn' ? 'dont-list' : 'care-list';

  // Check if body contains a markdown list
  const hasListItems = body.trim().split('\n').some(l => l.trim().startsWith('-'));

  let bodyHtml;
  if (hasListItems) {
    const items = body
      .trim()
      .split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(l => `<li>${l.replace(/^-\s*/, '')}</li>`)
      .join('\n');
    bodyHtml = `<ul class="${listClass}">\n${items}\n</ul>`;
  } else {
    bodyHtml = `<p>${body.trim()}</p>`;
  }

  const titleHtml = title
    ? `<div class="callout__title">${title}</div>\n`
    : '';

  // Wrap in a raw HTML block that marked will pass through
  return `<div class="callout callout--${type}">\n${titleHtml}${bodyHtml}\n</div>\n`;
}

/**
 * Post-process HTML to wrap step headings (## N. Title) in step card markup.
 * Detects <h2> tags with numbered pattern and wraps them + following content.
 */
function wrapStepHeadings(html) {
  // Split into sections by <h2> tags
  const stepPattern = /<h2>(\d+)\.\s+(.+?)<\/h2>/g;

  // Check if there are any step headings at all
  if (!stepPattern.test(html)) return html;
  stepPattern.lastIndex = 0;

  // Find all step heading positions
  const matches = [];
  let match;
  while ((match = stepPattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      fullMatch: match[0],
      number: match[1],
      title: match[2],
      end: match.index + match[0].length,
    });
  }

  if (matches.length === 0) return html;

  // Build output by slicing between step headings
  let result = '';

  // Content before first step
  result += html.slice(0, matches[0].index);

  for (let i = 0; i < matches.length; i++) {
    const step = matches[i];
    const nextStart = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const body = html.slice(step.end, nextStart).trim();

    result += `<div class="step">
<div class="step__number">${step.number}</div>
<div class="step__content">
<h2 class="step__title">${step.title}</h2>
${body}
</div>
</div>\n`;
  }

  return result;
}

module.exports = { parseContent };
