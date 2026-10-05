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
import { createServer } from 'node:http';
import { createReadStream, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* The page is checked over HTTP, not file://.
 *
 * It used to be file://, which is not how anyone reads this dashboard and
 * which quietly changes the rules: a null origin fails CORS, so every
 * @font-face is blocked and the whole page renders in the fallback stack.
 * Checking the typography of a page whose fonts cannot load is checking
 * nothing. The repository already knows this — it ships its data as .js
 * rather than .json for the same reason.
 *
 * So: a static server over the repository root, which is what Cloudflare
 * does with site/ in production. */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8'
};

const server = createServer((req, res) => {
  const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  let size;
  try { size = statSync(file).size; } catch { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, {
    'Content-Type': MIME[extname(file)] || 'application/octet-stream',
    'Content-Length': size
  });
  createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PAGE = `http://127.0.0.1:${server.address().port}/index.html`;

const launchOptions = { args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROMIUM_PATH) launchOptions.executablePath = process.env.CHROMIUM_PATH;

/* Sections the dashboard declares. An exact number, not a floor: this check
   exists to notice one disappearing, which a floor would not. */
const SECTION_COUNT = 9;

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
    check('navigation renders every section', count === SECTION_COUNT,
          `found ${count}, expected ${SECTION_COUNT}`);

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
     TYPOGRAPHY — the self-hosted faces actually arrived
     --------------------------------------------------------------------- */
  console.log('\nTYPOGRAPHY');
  {
    const page = await openPage(browser);
    const t = await page.evaluate(async () => {
      await document.fonts.ready;
      const loaded = [...document.fonts].filter(f => f.status === 'loaded')
                                        .map(f => f.family + ' ' + f.weight);
      const used = name => {
        const el = document.querySelector(name);
        return el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '') : null;
      };
      return {
        loaded,
        families: [...new Set([...document.fonts].filter(f => f.status === 'loaded')
                                                 .map(f => f.family))],
        heading: used('.kpi .value'),
        body: used('body'),
        tabular: getComputedStyle(document.querySelector('.kpi .value')).fontVariantNumeric
      };
    });
    /* The whole point of vendoring them: before this, both stacks fell all the
       way through to Times New Roman and Tahoma on nearly every visit. */
    check('both self-hosted faces load',
          t.families.includes('IBM Plex Sans Arabic') && t.families.includes('Noto Naskh Arabic'),
          t.families.join(', '));
    check('more than one weight is actually used',
          t.loaded.length >= 3, `${t.loaded.length} faces: ${t.loaded.join(' | ')}`);
    check('figures are set in tabular numerals',
          /tabular-nums/.test(t.tabular), t.tabular);
    check('no console or page errors while the fonts load',
          page.noise.length === 0, page.noise.slice(0, 4).join(' | '));
    await page.context().close();
  }

  /* ---------------------------------------------------------------------
     STATES — press feedback, and the skeleton that precedes the first paint
     --------------------------------------------------------------------- */
  console.log('\nSTATES');
  {
    const page = await openPage(browser);
    const st = await page.evaluate(() => {
      /* A pressed control has to say so. Every one of these had no :active
         rule at all before, so a tap that kicked off six chart redraws gave
         no sign it had registered. */
      /* Looks at the stylesheet, not the page: most of these controls only
         exist on a view other than this one, and an earlier version bailed
         out when the element was absent and so reported "no press state" for
         rules that were right there. */
      const probe = sel => {
        for (const sheet of document.styleSheets) {
          let rules; try { rules = sheet.cssRules; } catch { continue; }
          for (const r of rules) {
            if (r.selectorText && r.selectorText.includes(sel + ':active')) return r.style.transform || 'set';
          }
        }
        return null;
      };
      return {
        chip: probe('.chip'), item: probe('.item'),
        reset: probe('.btn-reset'), notice: probe('.notice button'),
        skipLink: !!document.querySelector('.skip-link'),
        grain: !!document.querySelector('.grain'),
        heroReserved: document.querySelector('.hero').getBoundingClientRect().height > 150
      };
    });
    check('controls acknowledge a press',
          !!(st.chip && st.item && st.reset && st.notice), JSON.stringify(st));
    check('there is a skip link past the masthead and band', st.skipLink);
    check('the grain overlay is present', st.grain);
    check('the band reserves its height before it mounts', st.heroReserved);

    /* The empty state a mistyped search lands on. */
    await page.evaluate(() => { location.hash = '#voc'; });
    await page.waitForTimeout(800);
    await page.fill('#qVoc', 'زززز');
    await page.waitForTimeout(500);
    const empty = await page.evaluate(() => ({
      composed: !!document.querySelector('#listVoc .nodata .nodata-title'),
      echoesTerm: (document.querySelector('#listVoc .term') || {}).textContent || '',
      hasAction: !!document.querySelector('#listVoc .btn-reset')
    }));
    check('a search that finds nothing offers a way out',
          empty.composed && empty.hasAction && empty.echoesTerm.includes('زززز'),
          JSON.stringify(empty));
    await clickOrFail('clearing the search restores the list',
                      page.locator('#listVoc .btn-reset'));
    await page.waitForTimeout(500);
    check('clearing the search restores the list',
          await page.evaluate(() => document.querySelectorAll('#listVoc .item').length > 0));
    check('no console or page errors across the states',
          page.noise.length === 0, page.noise.slice(0, 4).join(' | '));
    await page.context().close();
  }

  /* ---------------------------------------------------------------------
     REGIONS — read the map, open one, compare from inside it
     --------------------------------------------------------------------- */
  console.log('\nREGIONS');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 950 }, acceptDownloads: true });
    const page = await context.newPage();
    const noise = [];
    page.on('pageerror', e => noise.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') noise.push('console: ' + m.text()); });
    await page.goto(PAGE + '#regions', { waitUntil: 'load' });
    await page.waitForSelector('.rtile', { timeout: 15000 });
    await page.waitForTimeout(2500);

    const tiles = await page.locator('.rtile').count();
    check('every region has a tile on the map', tiles === 13, `${tiles} tiles`);

    /* The map is a cartogram, so its only real promise is that it reads as
       Saudi Arabia: east on the right even though the page is RTL, and the
       north above the south. A grid that silently inherited `direction: rtl`
       would still render 13 tiles, which is why this is geometry and not a
       count. */
    const geo = await page.evaluate(() => {
      const box = n => {
        const el = [...document.querySelectorAll('.rtile')]
          .find(t => t.dataset.region === n);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      return { east: box('الشرقية'), west: box('مكة المكرمة'),
               north: box('تبوك'), south: box('جازان') };
    });
    check('the map reads as the country, east on the right',
          geo.east && geo.west && geo.north && geo.south &&
          geo.east.x > geo.west.x && geo.north.y < geo.south.y,
          JSON.stringify(geo));

    /* Tiles must not pile into one cell: a `grid-row`/`grid-column` typo
       collapses the map into a stack that still passes every count. */
    const cells = await page.evaluate(() => {
      const seen = new Set();
      for (const t of document.querySelectorAll('.rtile')) {
        const r = t.getBoundingClientRect();
        seen.add(Math.round(r.left) + ':' + Math.round(r.top));
      }
      return seen.size;
    });
    check('no two tiles sit in the same cell', cells === 13, `${cells} distinct positions`);

    await clickOrFail('clicking a region opens its window',
                      page.locator('.rtile', { hasText: 'الرياض' }).first());
    await page.waitForTimeout(1600);
    const one = await page.evaluate(() => ({
      open: !!document.getElementById('regionWin'),
      hash: location.hash,
      heading: (document.querySelector('#regionWin h2') || {}).textContent || '',
      kpis: document.querySelectorAll('#rgWinBody .kpi').length,
      charts: document.querySelectorAll('#rgWinBody canvas').length,
      flat: [...document.querySelectorAll('#rgWinBody .chart')]
              .filter(e => e.getBoundingClientRect().width < 100).length
    }));
    check('one region draws its own figures in the window',
          one.open && /^#regions\/\d+$/.test(one.hash) &&
          one.heading.indexOf('الرياض') !== -1 &&
          one.kpis >= 6 && one.charts >= 5 && one.flat === 0,
          JSON.stringify(one));

    /* The compare picker is the whole point of the window, and it starts
       hidden — a button that toggles nothing would leave the page looking
       finished. */
    const hiddenFirst = await page.evaluate(() =>
      document.getElementById('rgPicker').hidden);
    await clickOrFail('the compare button opens the picker', page.locator('#rgPick'));
    await page.waitForTimeout(500);
    const picker = await page.evaluate(() => ({
      shown: !document.getElementById('rgPicker').hidden,
      options: document.querySelectorAll('#rgPicker .rgpick').length,
      self: [...document.querySelectorAll('#rgPicker .rgpick')]
              .some(p => p.textContent.indexOf('الرياض') === 0)
    }));
    check('the compare picker offers every other region',
          hiddenFirst && picker.shown && picker.options === 12 && !picker.self,
          JSON.stringify({ hiddenFirst, ...picker }));

    await clickOrFail('choosing a region compares the two',
                      page.locator('#rgPicker .rgpick').first());
    await page.waitForTimeout(1800);
    const two = await page.evaluate(() => ({
      hash: location.hash,
      heading: (document.querySelector('#regionWin h2') || {}).textContent || '',
      rows: document.querySelectorAll('#rgWinBody tbody tr').length,
      deltas: document.querySelectorAll('#rgWinBody .delta').length,
      charts: document.querySelectorAll('#rgWinBody canvas').length,
      flat: [...document.querySelectorAll('#rgWinBody .chart')]
              .filter(e => e.getBoundingClientRect().width < 100).length
    }));
    check('two regions compare side by side',
          /^#regions\/\d+\/\d+$/.test(two.hash) && two.heading.indexOf('مقابل') !== -1 &&
          two.rows === 8 && two.deltas === 8 && two.charts >= 3 && two.flat === 0,
          JSON.stringify(two));

    /* A difference shown in colour alone is unreadable to a chunk of the
       people this is for, so each delta carries a sign or an arrow too. */
    const signed = await page.evaluate(() =>
      [...document.querySelectorAll('#rgWinBody .delta')]
        .every(d => /[+\-−٠-٩0-9]/.test(d.textContent) &&
                    /(up|down|same)/.test(d.className)));
    check('every difference is readable without colour', signed);

    /* The export is the deliverable people actually take to a meeting, so it
       is checked as a real download with real content, not as a live button. */
    try {
      const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        page.click('#rgOneCsv')
      ]);
      const text = readFileSync(await dl.path(), 'utf8');
      const lines = text.split('\r\n');
      check('the comparison exports as a readable CSV',
            text.charCodeAt(0) === 0xFEFF && lines.length > 10 &&
            lines.some(l => l.indexOf('إجمالي الخريجين') === 0),
            `${text.length} bytes, ${lines.length} lines, BOM ${text.charCodeAt(0) === 0xFEFF}`);
    } catch (e) {
      check('the comparison exports as a readable CSV', false, e.message.split('\n')[0]);
    }

    /* Dropping back to one region, then out to the map. Escape has to work:
       the window covers the map, so a dialog that only closes by its ✕ is a
       trap for anyone on a keyboard. */
    await clickOrFail('the comparison can be dropped', page.locator('#rgUncompare'));
    await page.waitForTimeout(1200);
    check('dropping the comparison keeps the region open',
          await page.evaluate(() => /^#regions\/\d+$/.test(location.hash) &&
            !!document.getElementById('regionWin') &&
            document.querySelectorAll('#rgWinBody tbody tr').length !== 8));

    try {
      const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        page.click('#rgOneCsv')
      ]);
      const text = readFileSync(await dl.path(), 'utf8');
      check('a single region exports as a readable CSV',
            text.charCodeAt(0) === 0xFEFF && text.indexOf('الرياض') !== -1 &&
            text.split('\r\n').filter(Boolean).length > 8,
            `${text.split('\r\n').filter(Boolean).length} lines`);
    } catch (e) {
      check('a single region exports as a readable CSV', false, e.message.split('\n')[0]);
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    const closed = await page.evaluate(() => ({
      gone: !document.getElementById('regionWin'),
      hash: location.hash,
      locked: document.body.classList.contains('win-open'),
      map: document.querySelectorAll('.rtile').length
    }));
    check('Escape closes the window and leaves the map behind',
          closed.gone && closed.hash === '#regions' && !closed.locked && closed.map === 13,
          JSON.stringify(closed));

    /* Deep links are how a region gets shared, so the hash has to stand on
       its own from a cold load, comparison and all. */
    await page.goto(PAGE + '#regions/3/0', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    const deep = await page.evaluate(() => ({
      open: !!document.getElementById('regionWin'),
      rows: document.querySelectorAll('#rgWinBody tbody tr').length,
      charts: document.querySelectorAll('#rgWinBody canvas').length
    }));
    check('a comparison link opens on its own from a cold load',
          deep.open && deep.rows === 8 && deep.charts >= 3, JSON.stringify(deep));

    await page.goto(PAGE + '#regions', { waitUntil: 'load' });
    await page.waitForSelector('.rtile', { timeout: 15000 });
    await page.waitForTimeout(2000);
    try {
      const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        page.click('#rgsCsv')
      ]);
      const text = readFileSync(await dl.path(), 'utf8');
      const lines = text.split('\r\n').filter(Boolean);
      /* 13 regions, one header, and the provenance footer. A file that lost
         rows would still open cleanly, so the count is what is asserted. */
      check('all regions export with a row each',
            lines.length >= 15 && text.indexOf('سنوات التخرج') !== -1,
            `${lines.length} lines`);
    } catch (e) {
      check('all regions export with a row each', false, e.message.split('\n')[0]);
    }

    check('no console or page errors on the regions page',
          noise.length === 0, noise.slice(0, 4).join(' | '));
    await context.close();
  }

  /* ---------------------------------------------------------------------
     EXPORT CARDS — every exporting view hands over a real PNG
     --------------------------------------------------------------------- */
  console.log('\nEXPORT CARDS');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 950 }, acceptDownloads: true });
    const page = await context.newPage();
    const noise = [];
    page.on('pageerror', e => noise.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') noise.push('console: ' + m.text()); });

    /* A PNG's size lives in its header, so a card that drew nothing is not
       told apart from one that drew by file size alone. */
    const png = buf => ({
      ok: buf.length > 8 && buf.toString('ascii', 1, 4) === 'PNG',
      w: buf.readUInt32BE(16), h: buf.readUInt32BE(20)
    });

    async function grab(name, selector) {
      try {
        const [dl] = await Promise.all([
          page.waitForEvent('download', { timeout: 30000 }),
          page.click(selector)
        ]);
        return readFileSync(await dl.path());
      } catch (e) {
        check(name, false, e.message.split('\n')[0]);
        return null;
      }
    }

    /* The occupation card has two shapes of its own: one the workforce sheet
       covers, and one it does not. Both have to produce a card. */
    await page.goto(PAGE + '#workforce', { waitUntil: 'load' });
    await page.waitForSelector('#wfCard', { timeout: 20000 });
    await page.waitForTimeout(2500);
    const occHref = await page.evaluate(() =>
      (document.querySelector('[data-go^="#occ/"]') || {}).dataset.go);

    const views = [
      ['the regions map', '#regions', 'rgs'],
      ['one region', '#regions/3', 'rgOne'],
      ['a comparison', '#regions/3/0', 'rgOne'],
      ['an occupation', occHref, 'occ'],
      ['the workforce page', '#workforce', 'wf'],
      ['supply and demand', '#supply', 'sd']
    ];

    for (const [what, hash, prefix] of views) {
      await page.goto(PAGE + hash, { waitUntil: 'load' });
      await page.waitForSelector(`#${prefix}Card`, { timeout: 20000 });
      await page.waitForTimeout(2600);

      const portrait = await grab(`${what} exports a portrait card`, `#${prefix}Card`);
      if (portrait) {
        const p = png(portrait);
        /* Drawn at 2x, so 1080 logical is 2160 across. The height is cut to
           what was used, so it is only asserted to be a card rather than a
           strip. */
        check(`${what} exports a portrait card`,
              p.ok && p.w === 2160 && p.h > 1600 && portrait.length > 60000,
              `${p.w}x${p.h}, ${(portrait.length / 1024) | 0}KB`);
      }

      const wide = await grab(`${what} exports a 16:9 card`, `#${prefix}Wide`);
      if (wide) {
        const p = png(wide);
        check(`${what} exports a 16:9 card`,
              p.ok && p.w === 3840 && p.h === 2160 && wide.length > 60000,
              `${p.w}x${p.h}, ${(wide.length / 1024) | 0}KB`);
      }

      const csv = await grab(`${what} still exports its CSV`, `#${prefix}Csv`);
      if (csv) {
        const text = csv.toString('utf8');
        check(`${what} still exports its CSV`,
              text.charCodeAt(0) === 0xFEFF && text.split('\r\n').length > 3,
              `${text.split('\r\n').length} lines`);
      }
    }

    /* The button says it is working and comes back by itself. A card that
       left its button disabled would look like a page that had died.
       Watched rather than sampled: a card can finish inside the round trip
       it takes to ask, and a check that raced it would be reporting its own
       timing, not the button's behaviour. */
    await page.goto(PAGE + '#regions/3', { waitUntil: 'load' });
    await page.waitForSelector('#rgOneCard', { timeout: 20000 });
    await page.waitForTimeout(2600);
    const label = await page.textContent('#rgOneCard');
    await page.evaluate(() => {
      const b = document.getElementById('rgOneCard');
      window.__busy = { disabled: false, said: false };
      const start = b.textContent;
      new MutationObserver(() => {
        if (b.disabled) window.__busy.disabled = true;
        if (b.textContent !== start) window.__busy.said = true;
      }).observe(b, { attributes: true, childList: true, characterData: true, subtree: true });
    });
    await page.click('#rgOneCard');
    await page.waitForTimeout(8000);
    const busy = await page.evaluate(() => ({
      seen: window.__busy,
      disabled: document.getElementById('rgOneCard').disabled,
      text: document.getElementById('rgOneCard').textContent
    }));
    check('the card button says it is working, then comes back',
          busy.seen.disabled && busy.seen.said &&
          !busy.disabled && busy.text === label,
          JSON.stringify({ label, ...busy }));

    /* A card renders charts off-screen; if it left them in `live`, the next
       resize would reach for a disposed instance. */
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(900);
    check('drawing a card leaves no chart behind to break the next resize',
          noise.length === 0, noise.slice(0, 4).join(' | '));
    await context.close();
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
    check('every section is still reachable', s.nav === SECTION_COUNT, `${s.nav} links`);
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
  await new Promise(r => server.close(r));

  console.log('\n' + '='.repeat(60));
  const passed = results.filter(Boolean).length;
  console.log(`${passed}/${results.length} checks passed`);
  return results.every(Boolean) ? 0 : 1;
}

process.exit(await main());
