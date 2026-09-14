#!/usr/bin/env node
/**
 * Drive the built page in a real browser and assert what the interface layer
 * is supposed to do.
 *
 *     npx playwright install chromium     # once
 *     npm run check
 *
 * This exists because of a bug it would have caught and the earlier ad-hoc
 * checks did not. Those navigated by assigning `location.hash`, which is not
 * what a visitor does: it never runs the navigation's click handler, so the
 * travelling blob never appeared, so nobody noticed it was painting over the
 * label and leaving the open section as a blank rectangle. Every check below
 * that can be driven by a click is driven by a click.
 *
 * Checks are independent and all of them run; the exit code is non-zero if any
 * failed, in the style of scripts/verify_totals.py.
 *
 * CHROMIUM_PATH overrides the browser binary, for sandboxes that already have
 * one rather than Playwright's own download.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'file://' + join(ROOT, 'index.html');

const launchOptions = { args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROMIUM_PATH) launchOptions.executablePath = process.env.CHROMIUM_PATH;

const results = [];
function check(name, ok, detail) {
  results.push(ok);
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`);
  if (detail !== undefined && (!ok || process.env.VERBOSE)) console.log(`         ${detail}`);
  return ok;
}

/* Click something, and report a FAIL rather than throwing if it cannot be
 * clicked. An overlay swallowing a button is a finding, not a crash — and a
 * crash here would take the whole run down with it and hide everything after,
 * which is exactly what happened the first time an overlay did swallow one.
 * The element is centred first: the section bar is sticky, and something
 * parked under it is intercepted for a reason that is not a bug. Never pass
 * `force` — interception is the signal this is looking for. */
async function clickOrFail(name, locator, timeout = 6000) {
  try {
    await locator.evaluate(e => e.scrollIntoView({ block: 'center' }));
    await locator.click({ timeout });
    return true;
  } catch (e) {
    const why = /intercepts pointer events/.test(e.message)
      ? (e.message.match(/<[^>]+>.*intercepts pointer events/) || ['intercepted'])[0]
      : e.message.split('\n')[0];
    check(name, false, why);
    return false;
  }
}

/* Open the page and wait for the bundle to have hydrated the shell. */
async function openPage(browser, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 950 },
    reducedMotion: opts.reducedMotion
  });
  if (opts.blockBundle) await context.route('**/reactbits.js', r => r.abort());
  const page = await context.newPage();
  const noise = [];
  page.on('pageerror', e => noise.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') noise.push('console: ' + m.text()); });
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#view .kpi, #view .kpi-island').length > 0,
                             null, { timeout: 15000 });
  await page.waitForTimeout(opts.settle === undefined ? 2500 : opts.settle);
  page.noise = noise;
  return page;
}

/* Is there ink on this element, or is it a flat block of colour?
 *
 * The screenshot is handed back to the page as a data URI and read off a
 * canvas, so this needs no image library: a data: image does not taint the
 * canvas the way a file:// one would. "Ink" is any pixel far enough from the
 * element's own dominant colour to be a glyph rather than its background.
 *
 * `inset` trims the edges first, and it is not optional tidying. A pill's own
 * anti-aliased border and rounded corners read as ink against the band behind
 * it — enough of it that the first version of this check scored a completely
 * blank pill at 2.01% and waved it through. Only the interior says whether
 * anything was written there. */
async function inkFraction(page, locator, inset = 0) {
  const box = await locator.boundingBox();
  if (!box) return 0;
  const clip = { x: box.x + inset, y: box.y + inset,
                 width: box.width - inset * 2, height: box.height - inset * 2 };
  if (clip.width <= 1 || clip.height <= 1) return 0;
  const shot = (await page.screenshot({ clip })).toString('base64');
  return page.evaluate(async b64 => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;

    const bucket = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const k = (d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4);
      bucket.set(k, (bucket.get(k) || 0) + 1);
    }
    let top = null, best = -1;
    for (const [k, n] of bucket) if (n > best) { best = n; top = k; }
    const [br, bg, bb] = top.split(',').map(n => (Number(n) << 4) + 8);

    let ink = 0, total = d.length / 4;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i] - br) + Math.abs(d[i + 1] - bg) + Math.abs(d[i + 2] - bb) > 140) ink++;
    }
    return ink / total;
  }, shot);
}

async function main() {
  const browser = await chromium.launch(launchOptions);

  /* ---------------------------------------------------------------------
     SECTION NAVIGATION — clicked, not routed
     --------------------------------------------------------------------- */
  console.log('\nSECTION NAVIGATION  (real clicks, bar sticky)');
  {
    const page = await openPage(browser);
    /* Scrolled, so the bar is pinned — which is how it is used and how the
       blob's stacking is actually exercised. */
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(300);

    const links = page.locator('.gooey-nav-container nav ul li a');
    const count = await links.count();
    check('navigation renders every section', count === 6, `found ${count}, expected 6`);

    for (let i = 0; i < count; i++) {
      await links.nth(i).click();
      await page.waitForTimeout(900);

      const state = await page.evaluate(() => {
        const li = document.querySelector('.gooey-nav-container nav ul li.active');
        if (!li) return null;
        const a = li.querySelector('a');
        const r = a.getBoundingClientRect();
        const atCentre = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          label: a.innerText.replace(/\s+/g, ' ').trim(),
          hash: location.hash,
          covered: !(atCentre && a.contains(atCentre)),
          countPx: (() => { const c = li.querySelector('.nav-count');
                            return c ? getComputedStyle(c).fontSize : null; })()
        };
      });
      if (!state) { check(`section ${i + 1}: an item is marked active`, false); continue; }

      const activeLink = page.locator('.gooey-nav-container nav ul li.active a');
      const ink = await inkFraction(page, activeLink, 7);

      /* The bug: the blob painted over the item and the label vanished, so the
         open section was a flat rectangle. Hit-testing alone would have missed
         it — the label was still the topmost node, it just was not drawn. */
      check(`section ${i + 1} (${state.hash || '#overview'}) keeps its label visible`,
            ink > 0.04 && !state.covered && state.label.length > 0,
            `label=${JSON.stringify(state.label)} ink=${(ink * 100).toFixed(1)}% ` +
            `covered=${state.covered}`);

      /* The count is the reason the label is not the component's own mirrored
         copy, so it has to stay smaller than the label it sits beside. */
      if (state.countPx) {
        check(`section ${i + 1} keeps its count set small`,
              parseFloat(state.countPx) <= 12, `count is ${state.countPx}`);
      }
    }

    check('no console or page errors while navigating',
          page.noise.length === 0, page.noise.slice(0, 4).join(' | '));
    await page.context().close();
  }

  /* ---------------------------------------------------------------------
     CHARTS — the reveal wrapper must not cost them their width
     --------------------------------------------------------------------- */
  console.log('\nCHARTS AND LAYOUT');
  {
    const page = await openPage(browser);
    for (const hash of ['#overview', '#nqf', '#data', '#uni', '#voc', '#occ']) {
      await page.evaluate(h => { location.hash = h; }, hash);
      await page.waitForTimeout(900);
      const s = await page.evaluate(() => ({
        narrow: [...document.querySelectorAll('#view .chart')]
                  .filter(e => e.getBoundingClientRect().width < 100).length,
        hidden: [...document.querySelectorAll('#view .cardwrap .card')]
                  .filter(e => getComputedStyle(e).visibility === 'hidden'
                            || e.getBoundingClientRect().height < 20).length,
        charts: document.querySelectorAll('#view .chart').length
      }));
      check(`${hash}: every chart measured its box`, s.narrow === 0,
            `${s.narrow} of ${s.charts} collapsed`);
      check(`${hash}: no card left hidden by its reveal`, s.hidden === 0);
    }
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    check('page does not scroll sideways at 1440px', over <= 0, `overflow ${over}px`);
    check('no console or page errors across the sections',
          page.noise.length === 0, page.noise.slice(0, 4).join(' | '));
    await page.context().close();
  }

  /* ---------------------------------------------------------------------
     FILTERS, SEARCH, THE SPECIALIZATION WINDOW — all by click
     --------------------------------------------------------------------- */
  console.log('\nINTERACTION');
  {
    const page = await openPage(browser);
    const before = await page.textContent('.hero-figure.is-lead .hero-figure-value');
    await page.locator('#fYears .chip').first().click();
    await page.waitForTimeout(2200);
    const after = await page.evaluate(() => ({
      hero: document.querySelector('.hero-figure.is-lead .hero-figure-value').textContent,
      pressed: [...document.querySelectorAll('#fYears .chip')]
                 .filter(c => c.getAttribute('aria-pressed') === 'false').length
    }));
    check('dropping a year moves the band figure',
          after.hero !== before && after.pressed === 1, `${before} -> ${after.hero}`);

    await page.evaluate(() => { location.hash = '#occ'; });
    await page.waitForTimeout(900);
    await page.fill('#qOcc', 'مهندس');
    await page.waitForTimeout(600);
    const found = await page.evaluate(() => ({
      items: document.querySelectorAll('#listOcc .item').length,
      tall: document.getElementById('listOcc').getBoundingClientRect().height > 40
    }));
    check('searching inside a faded list still paints it',
          found.items > 0 && found.tall, `${found.items} items`);

    const opened = await clickOrFail('an occupation in the list opens',
                                     page.locator('#listOcc .item').first());
    await page.waitForTimeout(1200);
    if (opened) check('an occupation in the list opens', true);
    const detail = await page.evaluate(() => ({
      head: (document.querySelector('.detail-head h2') || {}).innerText || '',
      gradient: !!document.querySelector('.detail-head .animated-gradient-text')
    }));
    /* A gradient heading is painted through the glyphs, so an unresolved
       colour leaves it transparent — present in the DOM, and invisible.
       Measured on the run of text itself rather than the heading block: the
       block is mostly empty gutter, which would dilute a short title's ink
       below any threshold worth setting. */
    const glyphs = page.locator('.detail-head .animated-gradient-text .text-content');
    const headInk = (await glyphs.count())
      ? await inkFraction(page, glyphs)
      : await inkFraction(page, page.locator('.detail-head h2'));
    check('a detail heading is drawn, not just present',
          detail.head.length > 0 && detail.gradient && headInk > 0.06,
          `head=${JSON.stringify(detail.head.slice(0, 30))} ink=${(headInk * 100).toFixed(1)}%`);

    const spec = page.locator('.specitem').first();
    if (await spec.count()) {
      /* This tile sits inside a React Bits GlareHover, whose sweep is a
         full-bleed ::before. Upstream wraps things you only look at; this one
         is a button, and the overlay was eating every click on it. */
      const reached = await clickOrFail('a specialization tile takes a click', spec);
      if (reached) check('a specialization tile takes a click', true);
      await page.waitForTimeout(1400);
      const win = await page.evaluate(() => ({
        open: !!document.getElementById('specWin'),
        kpis: document.querySelectorAll('#specWin .kpi, #specWin .kpi-island').length,
        flat: [...document.querySelectorAll('#specWin .card')]
                .filter(e => e.getBoundingClientRect().height < 20).length
      }));
      check('the specialization window opens with its figures',
            win.open && win.kpis > 0 && win.flat === 0, JSON.stringify(win));
      if (win.open) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(700);
        check('Escape closes it',
              await page.evaluate(() => !document.getElementById('specWin')));
      }
    }
    check('no console or page errors while interacting',
          page.noise.length === 0, page.noise.slice(0, 4).join(' | '));
    await page.context().close();
  }

  /* ---------------------------------------------------------------------
     REDUCED MOTION — the finished state, not a frozen first frame
     --------------------------------------------------------------------- */
  console.log('\nREDUCED MOTION');
  {
    const page = await openPage(browser, { reducedMotion: 'reduce' });
    const s = await page.evaluate(() => ({
      webgl: !!document.querySelector('.hero-aurora canvas'),
      spark: !!document.querySelector('.rb-spark-layer'),
      figure: document.querySelector('.hero-figure.is-lead .hero-figure-value').textContent,
      flat: [...document.querySelectorAll('.cardwrap .card')]
              .filter(e => e.getBoundingClientRect().height < 20).length,
      title: (document.querySelector('.masthead h1') || {}).innerText || ''
    }));
    check('no WebGL and no spark canvas is mounted', !s.webgl && !s.spark);
    check('counters show the figure, not the zero they start from',
          /[1-9]/.test(s.figure), `figure is ${JSON.stringify(s.figure)}`);
    check('every card is on screen rather than waiting to arrive', s.flat === 0);
    check('the masthead title is still there', s.title.length > 20);
    await page.context().close();
  }

  /* ---------------------------------------------------------------------
     BUNDLE BLOCKED — the dashboard as it was before this layer existed
     --------------------------------------------------------------------- */
  console.log('\nBUNDLE BLOCKED');
  {
    const page = await openPage(browser, { blockBundle: true, settle: 2000 });
    const s = await page.evaluate(() => ({
      nav: document.querySelectorAll('.navband-fallback a').length,
      figures: [...document.querySelectorAll('#view .kpi .value')]
                 .filter(e => /[1-9]/.test(e.textContent)).length,
      charts: document.querySelectorAll('#view canvas').length,
      title: (document.querySelector('.masthead h1') || {}).innerText || ''
    }));
    check('every section is still reachable', s.nav === 6, `${s.nav} links`);
    check('the tiles still carry their figures', s.figures > 0, `${s.figures} filled`);
    check('the charts still draw', s.charts > 0, `${s.charts} canvases`);
    check('the masthead title survives without the bundle', s.title.length > 20);
    await page.context().close();
  }

  /* ---------------------------------------------------------------------
     PHONE WIDTH
     --------------------------------------------------------------------- */
  console.log('\nPHONE WIDTH  (390px)');
  {
    const page = await openPage(browser, { viewport: { width: 390, height: 844 } });
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    check('page does not scroll sideways at 390px', over <= 0, `overflow ${over}px`);
    await page.context().close();
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  const passed = results.filter(Boolean).length;
  console.log(`${passed}/${results.length} checks passed`);
  return results.every(Boolean) ? 0 : 1;
}

process.exit(await main());
