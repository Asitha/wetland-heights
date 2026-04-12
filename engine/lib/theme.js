const fs = require('fs');

/**
 * Load a theme from a JSON file path, or validate a provided theme object.
 */
function loadTheme(filePath, themeObj) {
  let theme;
  if (themeObj) {
    theme = themeObj;
  } else {
    const raw = fs.readFileSync(filePath, 'utf8');
    theme = JSON.parse(raw);
  }

  const required = ['colors', 'fonts', 'layout'];
  for (const field of required) {
    if (!theme[field]) {
      throw new Error(`Theme is missing required field: ${field}`);
    }
  }

  return theme;
}

/**
 * Generate a complete CSS string from a theme config.
 * All component styles are included with theme values interpolated.
 */
function generateCSS(theme) {
  const { colors, fonts, layout } = theme;

  return `*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: ${fonts.body};
    background: ${colors.bg};
    color: ${colors.text};
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
}

.page {
    max-width: ${layout.maxWidth};
    margin: 0 auto;
    padding: 0 20px 48px;
}

/* ---- Header ---- */
.header {
    background: ${colors.header.gradient};
    color: #fff;
    text-align: center;
    padding: 32px 20px 28px;
    margin: 0 -20px 28px;
    position: relative;
    overflow: hidden;
}
.header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${colors.header.bar};
}
.header__icon {
    font-size: 2.2rem;
    display: block;
    margin-bottom: 8px;
}
.header__title {
    font-family: ${fonts.heading};
    font-weight: 300;
    font-size: 1.75rem;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
}
.header__subtitle {
    font-size: 0.8rem;
    font-weight: 400;
    opacity: 0.85;
    letter-spacing: 0.03em;
}

/* ---- Steps ---- */
.step {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
}
.step__number {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background: ${colors.accent};
    color: #fff;
    border-radius: ${layout.borderRadius.badge};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    margin-top: 2px;
}
.step__content {
    flex: 1;
    min-width: 0;
}
.step__title {
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
}
.step__text {
    font-size: 0.9rem;
    color: ${colors.textSecondary};
    line-height: 1.65;
}

/* ---- Detergent Drawer Table ---- */
.drawer-label {
    font-size: 0.85rem;
    color: ${colors.textMuted};
    margin-bottom: 10px;
}
.drawer-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
    margin-bottom: 14px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: ${layout.shadow.table};
}
.drawer-table th {
    padding: 10px 8px;
    font-weight: 600;
    font-size: 0.78rem;
    text-align: center;
    color: #fff;
    line-height: 1.3;
}
.drawer-table th small {
    display: block;
    font-weight: 400;
    opacity: 0.9;
    margin-top: 2px;
}
.drawer-table th:nth-child(1) { background: ${colors.tableHeaders[0]}; }
.drawer-table th:nth-child(2) { background: ${colors.tableHeaders[1]}; }
.drawer-table th:nth-child(3) { background: ${colors.tableHeaders[2]}; }
.drawer-table td {
    padding: 10px 8px;
    text-align: center;
    background: ${colors.surface};
    border-bottom: 1px solid ${colors.border};
    color: ${colors.textSecondary};
    vertical-align: top;
    line-height: 1.45;
}
.drawer-table tr:last-child td {
    font-size: 0.78rem;
    color: ${colors.textMuted};
    font-style: italic;
}

/* ---- Callout boxes ---- */
.callout {
    border-radius: ${layout.borderRadius.callout};
    padding: 16px;
    margin-bottom: 24px;
    font-size: 0.88rem;
    line-height: 1.6;
}
.callout--pod {
    background: ${colors.callout.pod.bg};
    border-left: 4px solid ${colors.callout.pod.border};
}
.callout--pod strong {
    color: ${colors.callout.pod.strong};
}
.callout--tip {
    background: ${colors.callout.tip.bg};
    border-left: 4px solid ${colors.callout.tip.border};
}
.callout--tip strong {
    color: ${colors.callout.tip.strong};
}
.callout--warn {
    background: ${colors.callout.warn.bg};
    border-left: 4px solid ${colors.callout.warn.border};
}

.callout__title {
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* ---- Cycles ---- */
.cycles {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}
.cycle-tag {
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: ${layout.borderRadius.tag};
    padding: 6px 12px;
    font-size: 0.82rem;
    font-weight: 500;
}
.cycle-tag strong {
    color: ${colors.accent};
}
.cycle-tag span {
    color: ${colors.textMuted};
    font-weight: 400;
}

/* ---- Section dividers ---- */
.section {
    background: ${colors.surface};
    border-radius: ${layout.borderRadius.card};
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: ${layout.shadow.card};
}
.section__title {
    font-weight: 700;
    font-size: 0.95rem;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* ---- Collapsible details ---- */
.details {
    background: ${colors.surface};
    border-radius: ${layout.borderRadius.card};
    margin-bottom: 16px;
    box-shadow: ${layout.shadow.card};
    overflow: hidden;
}
.details__summary {
    padding: 14px 20px;
    font-weight: 600;
    font-size: 0.92rem;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${colors.text};
}
.details__summary::after {
    content: '+';
    font-size: 1.2rem;
    color: ${colors.textMuted};
    transition: transform 0.2s ease;
}
.details[open] > .details__summary::after {
    content: '−';
}
.details__summary::-webkit-details-marker {
    display: none;
}
.details__content {
    padding: 0 20px 16px;
    font-size: 0.88rem;
    color: ${colors.textSecondary};
    line-height: 1.6;
}

/* ---- Generic tables ---- */
table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    margin: 12px 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: ${layout.shadow.table};
}
table th {
    background: ${colors.accent};
    color: #fff;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 0.82rem;
}
table td {
    padding: 10px 12px;
    background: ${colors.surface};
    border-bottom: 1px solid ${colors.border};
    color: ${colors.textSecondary};
    vertical-align: top;
    line-height: 1.45;
}
table tr:last-child td {
    border-bottom: none;
}

/* ---- Don't list ---- */
.dont-list {
    list-style: none;
    font-size: 0.88rem;
}
.dont-list li {
    padding: 6px 0;
    padding-left: 24px;
    position: relative;
    color: ${colors.textSecondary};
}
.dont-list li::before {
    content: '\\2716';
    position: absolute;
    left: 0;
    color: ${colors.callout.warn.border};
    font-weight: 700;
    font-size: 0.8rem;
}

/* ---- Care tips ---- */
.care-list {
    list-style: none;
    font-size: 0.88rem;
}
.care-list li {
    padding: 6px 0;
    color: ${colors.textSecondary};
    line-height: 1.55;
}
.care-list li strong {
    color: ${colors.text};
}

.care-warning {
    background: ${colors.callout.pod.bg};
    border-radius: ${layout.borderRadius.tag};
    padding: 10px 12px;
    font-size: 0.82rem;
    margin-top: 4px;
    margin-bottom: 6px;
    color: ${colors.textMuted};
}

.detergent-note {
    font-size: 0.84rem;
    color: ${colors.textMuted};
    margin-top: 6px;
}

/* ---- Footer ---- */
.footer {
    text-align: center;
    padding-top: 12px;
    border-top: 1px solid ${colors.border};
    margin-top: 8px;
}
.footer a {
    color: ${colors.accent};
    text-decoration: none;
    font-weight: 500;
    font-size: 0.85rem;
}
.footer a:hover { text-decoration: underline; }`;
}

module.exports = { loadTheme, generateCSS };
