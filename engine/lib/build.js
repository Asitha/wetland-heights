const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { loadTheme, generateCSS } = require('./theme');
const { parseContent } = require('./parser');
const { render } = require('./renderer');

/**
 * Build a single markdown file into a styled HTML page.
 *
 * @param {string} mdPath - Path to the markdown file
 * @param {string} outDir - Output directory (index.html will be written here)
 * @param {string} themePath - Path to the theme JSON file
 * @returns {string} Path to the generated index.html
 */
function buildFile(mdPath, outDir, themePath) {
  const theme = loadTheme(themePath);
  const css = generateCSS(theme);

  const mdContent = fs.readFileSync(mdPath, 'utf8');
  const { meta, html: content } = parseContent(mdContent);

  const html = render({
    meta,
    content,
    css,
    fontsUrl: theme.fonts.googleFontsUrl,
    themeColor: meta.themeColor || theme.colors.accent,
  });

  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'index.html');
  fs.writeFileSync(outPath, html);

  return outPath;
}

/**
 * Build all markdown files in a content directory.
 * Maps content/path/to/file.md → outDir/path/to/file/index.html
 *
 * @param {string} contentDir - Root content directory to scan for .md files
 * @param {string} outDir - Root output directory
 * @param {string} themePath - Path to the theme JSON file
 * @returns {string[]} Array of generated file paths
 */
function buildAll(contentDir, outDir, themePath) {
  const pattern = path.join(contentDir, '**', '*.md').replace(/\\/g, '/');
  const files = globSync(pattern);

  const results = [];
  for (const mdPath of files) {
    const relativePath = path.relative(contentDir, mdPath);
    const parsed = path.parse(relativePath);
    // content/qr/6e/washing-machine.md → outDir/qr/6e/washing-machine/
    const fileOutDir = path.join(outDir, parsed.dir, parsed.name);

    const outPath = buildFile(mdPath, fileOutDir, themePath);
    results.push(outPath);
  }

  return results;
}

module.exports = { buildFile, buildAll };
