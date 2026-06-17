#!/usr/bin/env node
/**
 * Downloads the cover photo(s) from an Airbnb listing page.
 * Usage: node scripts/fetch-cover-photo.js <url> <output-path>
 * Example: node scripts/fetch-cover-photo.js https://airbnb.com.sg/h/6e-mount-lavinia assets/images/properties/mt-lavinia-2br.jpg
 */

const { chromium } = require('playwright');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const [,, url, outputPath] = process.argv;

if (!url || !outputPath) {
  console.error('Usage: node scripts/fetch-cover-photo.js <url> <output-path>');
  process.exit(1);
}

function download(src, dest) {
  return new Promise((resolve, reject) => {
    const proto = src.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(src, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  console.log(`Navigating to ${url} ...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Collect all large images from the photo gallery
  const imgSrcs = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .map(img => img.src)
      .filter(src =>
        src &&
        (src.includes('airbnb.com/im/pictures') || src.includes('a0.muscache.com')) &&
        !src.includes('profile_pic') &&
        !src.includes('user_profile')
      );
  });

  await browser.close();

  if (!imgSrcs.length) {
    console.error('No listing images found on the page.');
    process.exit(1);
  }

  // Pick the largest resolution variant of the first (cover) photo
  const coverSrc = imgSrcs[0].replace(/\?.*$/, '') + '?im_w=1200';
  console.log(`Found ${imgSrcs.length} image(s). Cover: ${coverSrc}`);

  const absOutput = path.resolve(outputPath);
  console.log(`Downloading to ${absOutput} ...`);
  await download(coverSrc, absOutput);
  console.log('Done.');
})();
