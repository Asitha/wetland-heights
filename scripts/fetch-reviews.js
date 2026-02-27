#!/usr/bin/env node
/**
 * Fetch guest reviews from Airbnb listings using Playwright.
 *
 * Usage:
 *   node scripts/fetch-reviews.js                        # All listings
 *   node scripts/fetch-reviews.js nugegoda-king-room     # Specific slug
 *   node scripts/fetch-reviews.js --json                 # JSON output
 *   node scripts/fetch-reviews.js --limit 5              # Max reviews per listing
 *
 * First-time setup:
 *   cd scripts && npm install playwright
 *   npx playwright install chromium
 */

const { chromium } = require('playwright');

// ── Listing registry ────────────────────────────────────────────────

const LISTINGS = {
  'nugegoda-king-room': {
    name: 'Nugegoda Residence · 1 BR',
    url: 'https://airbnb.com/h/nugegoda-king-room',
  },
  'nugegoda-residence': {
    name: 'Nugegoda Residence · 2 BR',
    url: 'https://airbnb.com/h/nugegoda-residence',
  },
};

// ── CLI argument parsing ────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { slugs: [], json: false, limit: 10 };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') {
      opts.json = true;
    } else if (args[i] === '--limit' && args[i + 1]) {
      opts.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: node scripts/fetch-reviews.js [slugs...] [options]

Slugs:    ${Object.keys(LISTINGS).join(', ')}
          (omit to fetch all)

Options:
  --limit N   Max reviews per listing (default: 10)
  --json      Output raw JSON
  --help      Show this help
`);
      process.exit(0);
    } else if (!args[i].startsWith('-')) {
      opts.slugs.push(args[i]);
    }
  }

  if (opts.slugs.length === 0) {
    opts.slugs = Object.keys(LISTINGS);
  }

  const invalid = opts.slugs.filter((s) => !LISTINGS[s]);
  if (invalid.length > 0) {
    console.error(`Unknown listing(s): ${invalid.join(', ')}`);
    console.error(`Available: ${Object.keys(LISTINGS).join(', ')}`);
    process.exit(1);
  }

  return opts;
}

// ── Review scraper ──────────────────────────────────────────────────

async function fetchReviews(url, limit) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    // Scroll to trigger lazy-loaded content
    for (let i = 0; i < 10; i++) {
      await page.evaluate((step) => window.scrollTo(0, step * 800), i);
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2000);

    // Try opening the reviews modal
    try {
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.innerText().catch(() => '');
        if (/show all.*review/i.test(text)) {
          await btn.click();
          await page.waitForTimeout(3000);
          // Scroll inside modal
          const modal = await page.$('[role="dialog"]');
          if (modal) {
            for (let j = 0; j < 5; j++) {
              await modal.evaluate((el) => (el.scrollTop += 600));
              await page.waitForTimeout(400);
            }
          }
          break;
        }
      }
    } catch (_) {}

    // Extract data from rendered page
    const data = await page.evaluate((maxReviews) => {
      // Rating and count from embedded JSON
      let rating = null;
      let reviewCount = null;
      const html = document.body.innerHTML;
      const ratingMatch = html.match(/"ratingValue":(\d+\.?\d*)/);
      const countMatch = html.match(/"reviewCount":(\d+)/);
      if (ratingMatch) rating = parseFloat(ratingMatch[1]);
      if (countMatch) reviewCount = parseInt(countMatch[1], 10);

      const reviews = [];
      const seen = new Set();

      const skip = [
        'check-in', 'check-out', 'show all', 'report', 'cookie',
        'airbnb', 'cancel', 'privacy', '©', 'activate drag', 'keyboard',
        'amenities', 'policy', 'translate', 'original', 'response from',
        'add your trip', 'hi there', 'we are', 'located in',
        'rated ', 'out of 5', 'guests say', 'well-suited',
        'recent guests', 'dining out', 'restaurants nearby',
        'add dates', 'for prices', 'cancellation', 'hosted by',
        'co-host', 'superhost', 'identity verified', 'show more',
      ];

      const allEls = document.querySelectorAll('div, span');

      allEls.forEach((el) => {
        if (reviews.length >= maxReviews) return;
        const text = el.innerText?.trim();
        if (!text || text.length < 30 || text.length > 600) return;
        if (seen.has(text)) return;
        if (el.children.length > 0) return;
        if (!text.includes('.') && !text.includes('!')) return;

        const lower = text.toLowerCase();
        if (skip.some((s) => lower.includes(s))) return;

        // Must be near a star rating to be a real review
        let container = el.parentElement;
        let parentText = '';
        for (let depth = 0; depth < 8 && container; depth++) {
          parentText = container.innerText || '';
          if (/Rating,\s*\d\s*star/i.test(parentText)) break;
          container = container.parentElement;
        }
        if (!/Rating,\s*\d\s*star/i.test(parentText)) return;

        // Extract reviewer info from context
        let name = null;
        let date = null;
        let location = null;
        let stars = 5;

        const starMatch = parentText.match(/Rating,\s*(\d)\s*star/i);
        if (starMatch) stars = parseInt(starMatch[1], 10);

        const lines = parentText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        for (const line of lines) {
          // Name: short text, first line that isn't metadata
          if (
            !name &&
            line.length >= 2 &&
            line.length <= 25 &&
            !/Rating|star|review|·|Stayed|ago|year|Airbnb|Show|Read/i.test(line) &&
            !/^\d/.test(line) &&
            line !== text.substring(0, line.length)
          ) {
            name = line;
          }

          // Date: "Month YYYY" or "N weeks/days ago"
          if (
            !date &&
            (/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i.test(line) ||
              /\d+\s+(?:week|day|month)s?\s+ago/i.test(line))
          ) {
            date = line;
          }

          // Location: "City, Country"
          if (
            !location &&
            line.includes(',') &&
            line.length < 40 &&
            !/Rating|·|Stayed|star/i.test(line)
          ) {
            location = line;
          }
        }

        seen.add(text);
        reviews.push({ text, name, location, date, stars });
      });

      return { rating, reviewCount, reviews };
    }, limit);

    return data;
  } finally {
    await browser.close();
  }
}

// ── Output formatting ───────────────────────────────────────────────

function wrapText(text, width, indent) {
  const words = text.split(' ');
  const lines = [];
  let current = indent;

  for (const word of words) {
    if (current.length + word.length + 1 > width && current.trim().length > 0) {
      lines.push(current);
      current = indent + word;
    } else {
      current += (current === indent ? '' : ' ') + word;
    }
  }
  if (current.trim()) lines.push(current);
  return lines.join('\n');
}

function printReviews(listingName, data) {
  if (data.error) {
    console.log(`\n  ${listingName}`);
    console.log(`  Error: ${data.error}\n`);
    return;
  }

  const { rating, reviewCount, reviews } = data;
  const bar = '='.repeat(70);

  console.log(`\n${bar}`);
  console.log(`  ${listingName}`);
  if (rating && reviewCount) {
    console.log(`  ${'★'.repeat(Math.round(rating))} ${rating} (${reviewCount} reviews)`);
  } else if (reviewCount === 0) {
    console.log('  No reviews yet');
  }
  console.log(bar);

  if (!reviews || reviews.length === 0) {
    console.log('  No review text found.\n');
    return;
  }

  reviews.forEach((r, i) => {
    const stars = '★'.repeat(r.stars);
    const name = r.name || 'Guest';
    const meta = [name, r.location, r.date].filter(Boolean).join(' · ');

    console.log(`\n  ${i + 1}. ${stars}`);
    console.log(wrapText(`"${r.text}"`, 70, '     '));
    console.log(`     — ${meta}`);
  });

  console.log();
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  const allResults = {};

  for (const slug of opts.slugs) {
    const listing = LISTINGS[slug];
    if (!opts.json) {
      process.stdout.write(`\nFetching reviews for ${listing.name}...`);
    }

    try {
      const data = await fetchReviews(listing.url, opts.limit);
      allResults[slug] = { name: listing.name, ...data };

      if (!opts.json) {
        process.stdout.write(' done.\n');
        printReviews(listing.name, data);
      }
    } catch (err) {
      allResults[slug] = { name: listing.name, error: err.message };
      if (!opts.json) {
        process.stdout.write(' failed.\n');
        console.error(`  Error: ${err.message}`);
      }
    }
  }

  if (opts.json) {
    console.log(JSON.stringify(allResults, null, 2));
  }
}

main();
