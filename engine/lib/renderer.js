const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Load and compile the page template once
const templatePath = path.join(__dirname, '..', 'templates', 'page.hbs');
const templateSource = fs.readFileSync(templatePath, 'utf8');
const template = Handlebars.compile(templateSource);

/**
 * Render a complete HTML page from parsed content, meta, and CSS.
 *
 * @param {Object} options
 * @param {Object} options.meta - Frontmatter data (title, subtitle, icon, noindex, etc.)
 * @param {string} options.content - HTML body content
 * @param {string} options.css - Complete inline CSS string
 * @param {string} [options.fontsUrl] - Google Fonts URL
 * @param {string} [options.themeColor] - Theme color for mobile browser chrome
 * @returns {string} Complete HTML document
 */
function render({ meta, content, css, fontsUrl, themeColor }) {
  return template({
    meta,
    content,
    css,
    fontsUrl: fontsUrl || '',
    themeColor: themeColor || meta.themeColor || '#8C6338',
  });
}

module.exports = { render };
