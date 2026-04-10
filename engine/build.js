#!/usr/bin/env node

const path = require('path');
const { buildFile, buildAll } = require('./lib/build');

const args = process.argv.slice(2);
const engineDir = __dirname;
const defaultTheme = path.join(engineDir, 'themes', 'wetland-heights.json');

function usage() {
  console.log('Usage:');
  console.log('  node build.js <file.md> --out <dir>     Build a single file');
  console.log('  node build.js --all --content <dir> --out <dir>  Build all .md files');
  process.exit(1);
}

if (args.includes('--all')) {
  const contentIdx = args.indexOf('--content');
  const outIdx = args.indexOf('--out');
  const themeIdx = args.indexOf('--theme');

  const contentDir = contentIdx !== -1 ? args[contentIdx + 1] : path.join(engineDir, '..', 'content');
  const outDir = outIdx !== -1 ? args[outIdx + 1] : path.join(engineDir, '..', 'dist');
  const themePath = themeIdx !== -1 ? args[themeIdx + 1] : defaultTheme;

  console.log(`Building all .md files in ${contentDir}...`);
  const results = buildAll(contentDir, outDir, themePath);
  console.log(`Built ${results.length} file(s):`);
  results.forEach(f => console.log(`  ✓ ${f}`));
} else if (args.length >= 1 && !args[0].startsWith('--')) {
  const mdPath = args[0];
  const outIdx = args.indexOf('--out');
  const themeIdx = args.indexOf('--theme');

  if (outIdx === -1) {
    console.error('Error: --out <dir> is required');
    usage();
  }

  const outDir = args[outIdx + 1];
  const themePath = themeIdx !== -1 ? args[themeIdx + 1] : defaultTheme;

  const result = buildFile(mdPath, outDir, themePath);
  console.log(`Built: ${result}`);
} else {
  usage();
}
