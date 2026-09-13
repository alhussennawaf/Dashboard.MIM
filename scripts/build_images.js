/*
 * Generate the favicon set and the social preview image.
 *
 *     node scripts/build_images.js
 *
 * One-time asset build: the PNGs it writes are committed, so nothing here runs
 * during a deploy and the project keeps its "no build step to view it" promise.
 * Re-run it only when the emblem or the card design changes.
 *
 * It needs Playwright, which the project does not otherwise depend on. Chromium
 * is used rather than a Python drawing library because the card carries Arabic:
 * a browser shapes and joins the glyphs correctly, an image library that does
 * not do bidi would silently emit disconnected letters in the wrong order.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets');
const EXEC = process.env.CHROMIUM_PATH ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// The emblem's viewBox is 79.12 x 65.83; an icon must be square, so it is
// centred on a square canvas rather than stretched.
const ICON_SIZES = [16, 32, 48, 180, 512];

async function main() {
  const browser = await chromium.launch({ executablePath: EXEC });

  // ---- favicons -----------------------------------------------------------
  const emblem = fs.readFileSync(path.join(OUT, 'mim-emblem.svg'), 'utf8');
  for (const size of ICON_SIZES) {
    const page = await browser.newPage({
      viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(
      `<style>html,body{margin:0;height:100%;background:#fff}
       body{display:flex;align-items:center;justify-content:center}
       svg{width:88%;height:88%}</style>${emblem}`);
    await page.screenshot({ path: path.join(OUT, `icon-${size}.png`), omitBackground: false });
    await page.close();
    console.log(`icon-${size}.png`);
  }

  // ---- social preview card ------------------------------------------------
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'og_card.html'));
  await page.waitForTimeout(600);            // let the logo SVG paint
  await page.screenshot({ path: path.join(OUT, 'og-image.png') });
  await page.close();
  console.log('og-image.png');

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
