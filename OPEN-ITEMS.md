# Open items, standing instructions, and things worth knowing

Kept here because sessions end and this does not. Last written 2026-10-31.

---

## 1. Standing instructions

Decisions already taken. They hold until the person who set them says
otherwise, and they are not re-litigated at the start of every session.

* **Never change a colour in `assets/brand.css`.** The palette is the
  ministry's and was given as a constraint on day one. Fonts, comments and
  tokens in that file may change; colour lines may not.
* **No em dashes anywhere the project owns.** 159 were removed on
  2026-10-31. Use a colon where the clause explains, a comma where it is an
  aside, parentheses where the dash came in a pair. Three remain on purpose:
  the `[–—-]` character class in `parse_sources.py`, which splits the
  ministry's own strings, and four inside the vendored ECharts build, which
  reappear in the two inlined pages.
* **The localisation figure is «فرص التوطين», not «فجوة التوطين»**, and every
  tile showing it keeps «وظائف يشغلها غير سعوديون» underneath, because the
  name alone reads as vacancies and these posts are filled.
* **Every view that exports a CSV also exports a card**, in both shapes:
  portrait to send, 16:9 for a slide. The single-region portrait card carries
  two charts (the medium of the three lengths that were offered).
* **Official contact address: `a.algailan@mim.gov.sa`**, in `privacy.html`
  and `terms.html`.
* **The workforce file's printed block totals are authoritative** per the data
  owner. See §3 for what that leaves open.
* **A radar's area means nothing** and the occupation shape chart says so in
  its own subtitle. Do not quietly drop that line.

---

## 2. Waiting on a person

* **Three commits are merged into nothing yet.** `claude/upbeat-maxwell-dthuip`
  is ahead of the default branch by: the contact address and this file
  (`08ffe22`), the occupation shape hexagon (`fe8350a`), and the source-totals
  note (`047f0ff`). All three pass 99/99 checks. Merging them also means
  republishing the artifact, which is currently a version behind.
* **Five merged branches need deleting.** `labour-market`, `redesign`,
  `design-polish`, `claude/modest-cray-2b2sgd`, and
  `claude/upbeat-maxwell-dthuip` once the three commits above are in. All are
  fully contained in the default branch. An agent session cannot delete them:
  the proxy refuses both `git push --delete` and the REST path. It is a click
  on the repository's branches page.
* **`cf_beacon_token` is empty** in `site.config.json`, so no analytics runs
  while `privacy.html` tells visitors analytics is used. Either set the token
  or cut that sentence. This is the only warning `build_site.py` still prints.
* **`indexable` is true.** The site will be indexed as soon as it is
  reachable. Deliberate, but worth knowing before the link goes out.
* **Safari is unverified.** Everything is checked in Chromium. Two things in
  the export cards lean recent: `ctx.roundRect`, shimmed by hand so it
  degrades, and `ctx.letterSpacing`, ignored where absent at the cost of the
  tracking on one label.

---

## 3. Open questions in the data

* **Two Saudi workers have no row.** «مهن أساسية مهارات متوسطة» prints 8,149
  Saudis; its 228 rows carry 8,147. The owner has confirmed the printed total
  is right, which means a row is missing rather than a total being wrong. The
  dashboard shows the row sum, because every figure on it must open to an
  occupation by name, and states the difference on the البيانات page. Closing
  it properly needs the missing row from the data owner: two Saudis, in some
  occupation of that block.
* **The qualification-routing rule still has no join key.** The
  secondary-institute split exists exactly (`دبلوم معاهد ثانوي صناعي`, 20,875
  graduates, 61 institutes), but the master list names ISCED fields while the
  vocational file names TVTC programmes, and the two match on 0% of strings.
  51% of متوسطة occupations carry only the catch-all
  `تنمية المهارات والتنمية الشخصية`. A draft mapping of the 327 TVTC
  programmes onto ISCED fields, for Dr. Kholoud to correct, was offered and
  not yet taken up. **This is the single largest unlock left in the project.**
* **«المهن المستهدفة في سوق العمل الحالي» is not in the repository.** It was
  asked about on 2026-10-31 and nothing by that name exists in `data/`, the
  repo, or any upload. If it arrives, the first question is whether it carries
  occupation **codes** or only names: names cost a day's work last time. It
  would answer the one thing العرض والطلب cannot say today, which is which
  gaps the ministry actually wants closed rather than which are largest.

---

## 4. Settled, recorded so nobody reopens it

* **PR #3 is closed** (version B of the design). The `design-high-end` branch
  is kept, so version B is one checkout away. Version A shipped in PR #2.
* **One source typo is corrected, and the correction is recorded rather than
  hidden**: `ميكانيكي معدات الكرتونية → ميكانيكي معدات إلكترونية`, in
  `SOURCE_TYPOS` in `scripts/parse_sources.py`. The payload reports
  `corrections: 1`. Further corrections go in the same table, never in the
  workbook and never silently.
* **The skills chart is option (أ)**, chosen over the category radar because
  the four categories carry one dimension between them: leadership is empty in
  886 of 921 records and basic and general both sit at about 1.2. Counting
  skills by level yields 484 distinct shapes against 276 for the categories.
* **The occupation shape hexagon is option (ب)**, built afterwards with both
  of its known faults fixed: employment size is a percentile, not a share of
  the maximum, and an occupation with no workforce row drops those two axes
  rather than drawing them at zero.

---

## 5. The data, and the traps in it

* **The catalogue and the workforce file are different universes.**
  `260218 Final Master Sheet` holds 921 records resolving to 548 occupations
  (129 of them carry 373 specializations between them). The workforce file
  holds 503 rows and nothing but headcount. So 45 occupations have names,
  codes, skills, sectors and NQF levels but no employment figure, and the
  pages say «لا تَرِد هذه المهنة في جدول العاملين» rather than printing a
  zero. The join is by normalised Arabic name, not by code, and it is 503/503
  only because of the typo fix above.
* **Worker data carries no year and no region.** It is a snapshot of who holds
  the job today. The year chips do not touch it; المناطق shows graduates only,
  since a national rate on a region card would be read as that region's; and
  on العرض والطلب a region filters supply alone while demand stays national,
  which the page warns about in that state. `WF_NOTE` states it in one place.
* **Supply must never be summed per occupation.** Occupations share education
  fields, so adding each occupation's pool gives 2,145,783 against a true
  153,078, from a file of 185,596 rows. `supplyUnion()` takes the union of
  distinct majors. The per-occupation column is a pool on purpose: it answers
  "who could this job hire", which is why its header says it cannot be added
  down.

---

## 6. Working on this repository

* **`npm run check` is the gate.** 99 checks in a real browser, about fifteen
  minutes. It asserts pixels, not DOM: this project's bugs hide from the DOM,
  which is how a nav label that `elementFromPoint` still returned went missing
  for a release.
* **`python3 scripts/verify_totals.py`** checks 11 figures against the source
  workbooks. Run it after anything that touches the parser.
* **Derived outputs drift silently.** After any change to `index.html`, run
  `build_standalone.py`, `build_artifact.py` and `build_site.py`. After any
  change under `ui/`, run `npm run build` first. All are committed, because
  the Cloudflare build runs `wrangler deploy` and does not run these.
* **The container is ephemeral.** It has been rebuilt mid-session and
  `node_modules` went with it, which fails a check run on a missing
  `playwright` import rather than on anything real. Run `npm install` before
  debugging a failure that looks like that.
* **Chromium is at `/opt/pw-browsers/chromium`.** Pass it as `CHROMIUM_PATH`;
  never let Playwright download its own.
* **`data/` is the ministry's.** The workbooks are deliberately kept out of
  `site/` by the allow-list in `build_site.py`, and nothing in them is edited
  to make a join work.

---

## 7. The artifact

`https://claude.ai/artifact/XWP1TAJasnhnxjRjk2XEqG` is the whole dashboard as
one self-contained page, rebuilt by `scripts/build_artifact.py` and published
to that same URL. It is **private** until shared from its own Share menu. Its
export buttons work through a bridge that `build_artifact.py` appends: the
viewer never lets a framed page save a file, so without it every export would
silently do nothing. It is currently one version behind the branch.

---

## Appendix: the 45 occupations with no employment row

* `132210` مدير عمليات هيدرولوجية
* `213103` أخصائي علوم فيزياء حيوية
* `213113` أخصائي علوم أوبئة
* `213306` مستشار بيئي
* `214408` مهندس ميكانيكي قطارات
* `214903` مهندس متفجرات
* `214916` أخصائي تقنية هندسة نووية
* `216503` مسّاح جيوديسي
* `216508` مهندس مساحة
* `311512` فني ميكانيكي قطارات
* `621004` فحَام
* `721202` لحّام تحت الماء
* `731202` صانع ومصلح آلات موسيقية نفخية
* `731203` صانع ومصلح آلات موسيقية وترية
* `731204` صانع ومصلح آلات موسيقية نقر
* `751302` صانع سمن
* `751303` صانع أقط
* `751601` مصنع منتجات تبغ
* `751602` معد منتجات تبغ
* `811307` عامل تبطين آبار مياه
* `815503` مشغل آلة حلاقة الجلود
* `815506` مشغل آلة دباغة جلود
* `815602` مشغل آلة تشطيب أحذية
* `815902` مشغل آلة صنع ضفائر
* `815904` مشغل آلة صنع مناطيد
* `816005` مشغل آلة منتجات أوراق نباتات
* `817101` مشغل آلة معالجة سليلوز
* `817102` مشغل آلة معالجة لب
* `817204` مشغل آلة تزرير خشب
* `931101` عامل منجم
* `931102` عامل محجر
* `931201` عامل إنشاءات
* `931202` عامل صيانة الطرق
* `931204` جامع عينات تربة
* `931205` قائس سيول
* `931206` عامل حفر
* `931301` عامل بناء
* `931302` عامل خلطة خرسانية
* `931303` عامل هدم
* `932101` عامل تعبئة وتغليف
* `932102` عامل وضع ملصقات
* `932901` عامل تصنيع
* `932902` عامل فرز منتجات
* `932903` عامل ورشة
* `933301` عامل تحميل وتنزيل
