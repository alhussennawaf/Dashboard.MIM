# Open items and things worth knowing

Kept here because sessions end and this does not. Last written 2026-10-31.

## Waiting on a person, not on code

* **Five merged branches need deleting.** `labour-market`, `redesign`,
  `design-polish`, `claude/modest-cray-2b2sgd` and `claude/upbeat-maxwell-dthuip`
  are all fully contained in the default branch and carry nothing unique.
  An agent session cannot delete them: the proxy refuses both
  `git push --delete` and the REST path. It is a click on the repository's
  branches page, or `git push origin --delete <name>` from a laptop.
* **`cf_beacon_token` is empty** in `site.config.json`, so no analytics runs,
  while `privacy.html` tells visitors that analytics is used. Set the token
  or edit that page before launch. `scripts/build_site.py` prints this on
  every build and will keep printing it.
* **`indexable` is true.** The site will be indexed as soon as it is
  reachable. Deliberate, but worth knowing before the link is shared.
* **Safari is unverified.** Everything is checked in Chromium. Two things in
  the export cards lean recent: `ctx.roundRect` (shimmed by hand, so it
  degrades) and `ctx.letterSpacing` (ignored where absent, which costs only
  the tracking on one label).

## The data, and the traps in it

* **The workforce sheet covers 503 of 548 occupations.** The other 45 have no
  headcount and no Saudization. The pages say «لا تَرِد هذه المهنة في جدول
  العاملين» rather than showing a zero, because the source does not say
  whether it is zero or merely absent. Mostly general labouring
  (عامل منجم، عامل بناء، عامل تحميل وتنزيل), niche machine operators
  (دباغة جلود، معالجة سليلوز), rare technical work (مهندس متفجرات،
  لحّام تحت الماء، مسّاح جيوديسي) and crafts (صانع ومصلح آلات موسيقية،
  صانع سمن، صانع أقط).
* **Worker data carries no year and no region.** It is a snapshot of who holds
  the job today, not a series. The year chips do not touch it, and the regions
  page shows graduates only: a national Saudization figure on a region card
  would be read as that region's. `WF_NOTE` states this in one place and every
  view that shows the figures repeats it.
* **Supply must never be summed per occupation.** Occupations share education
  fields, so adding each occupation's graduate pool gives 2,145,783 against a
  true 153,078. `supplyUnion()` takes the union of distinct majors and exists
  for exactly this. The per-occupation column in the table is a pool, which is
  why its own header says it cannot be added down.
* **One source typo is corrected, and the correction is recorded rather than
  hidden.** `ميكانيكي معدات الكرتونية → ميكانيكي معدات إلكترونية`, in
  `SOURCE_TYPOS` in `scripts/parse_sources.py`. The payload reports
  `corrections: 1` so the count can be audited. Any further correction goes in
  the same table, never in the workbook and never silently.
* **The qualification-routing rule cannot be joined as data yet.** The
  secondary-institute split the ministry asked about exists exactly
  (`دبلوم معاهد ثانوي صناعي`, 20,875 graduates, 61 institutes), but the master
  occupation list names ISCED fields while the vocational file names TVTC
  programmes, and the two match on 0% of strings. 51% of متوسطة occupations
  carry only the catch-all `تنمية المهارات والتنمية الشخصية`. Closing this
  needs a human mapping of the 327 TVTC programmes onto ISCED fields; a draft
  table for Dr. Kholoud to correct was offered and not yet taken up.

## Working on this repository

* **`npm run check` is the gate.** 98 checks in a real browser, about fifteen
  minutes. It asserts pixels, not DOM: this project's bugs hide from the DOM,
  which is how a nav label that `elementFromPoint` still returned went missing
  for a release.
* **`python3 scripts/verify_totals.py`** checks 11 figures against the source
  workbooks. Run it after anything that touches the parser.
* **Derived outputs drift silently.** After any change to `index.html`, run
  `build_standalone.py`, `build_artifact.py` and `build_site.py`. After any
  change under `ui/`, run `npm run build` first. All of them are committed,
  because the Cloudflare build runs `wrangler deploy` and does not run these.
* **The container is ephemeral.** It has been rebuilt mid-session and
  `node_modules` went with it, which fails a check run on a missing
  `playwright` import rather than on anything real. Run `npm install` before
  debugging a failure that looks like that.
* **Chromium is at `/opt/pw-browsers/chromium`.** Pass it as `CHROMIUM_PATH`;
  never let Playwright download its own.
* **`data/` is the ministry's.** The workbooks under it are deliberately kept
  out of `site/` by the allow-list in `build_site.py`, and nothing in them is
  edited to make a join work.

## The artifact

`https://claude.ai/artifact/XWP1TAJasnhnxjRjk2XEqG` is the whole dashboard as
one self-contained page, rebuilt by `scripts/build_artifact.py` and published
to that same URL. It is **private** until shared from its own Share menu. Its
export buttons work through a bridge that build_artifact.py appends: the
viewer never lets a framed page save a file, so without it every export would
silently do nothing.
