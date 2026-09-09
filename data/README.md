# Data sources, parsing, and brand provenance

Everything the dashboard displays traces back to a cell in one of the source
workbooks or a page of one of the source PDFs. This file records where each
figure and each brand value came from, and — just as important — what could
**not** be determined and is therefore shown as unclassified rather than
guessed.

Regenerate everything with:

```
python3 scripts/parse_sources.py      # sources -> data/dashboard-data.{js,json}
python3 scripts/verify_totals.py      # independent check of the output
python3 scripts/build_standalone.py   # optional single-file build
```

---

## 1. Source files

| File | What it is | Rows used |
|---|---|---|
| `خريجي التعليم المهني 2020-2025.xlsx` | Vocational/technical graduates | 6,108 (sheet `Sheet1`) |
| `خريجي الجامعات للتخصصات بالمجال 0705 2020-2025.xlsx` | University graduates | 4,813 (sheet `النتائج`) |
| `260218 Final Master Sheet with Occupations in EN.xlsx` | Occupations framework | 921 (sheet `قائمة المهن المشمولة Master`) |
| `nationalqualificationsframework.pdf` | NQF, 3rd edition (1447H / 2026) | level table, p.40 |
| `MiM_Brand_Guidelines_Short_Version_v1.1.pdf` | Brand guidelines, 11 Oct 2021 | pp.5, 6, 26–34 |

### Scope — read this before quoting any total

The occupations sheet covers **all 13 sub-sectors**, not mining alone: each
sector draws on 277–415 occupations, 569 of the 921 rows serve no mining
sector at all, and only 108 are mining-exclusive.

The university workbook is **not** all Saudi university graduates. Its
`الصفحة_الرئيسية` sheet states the request as:

> طلب بيانات خريجي الجامعات السعودية في التخصصات المرتبطة بقطاع الصناعة والتعدين
> (Req# NLODM-4080)

It covers exactly two general fields — `العلوم الطبيعية والرياضيات والإحصاء`
and `الهندسة والتصنيع والبناء`. The dashboard says so in its scope banner. Do
not present its totals as national university output.

---

## 2. Column mapping

### Vocational (`Sheet1`, header on row 1)

| Source column | Used as | Notes |
|---|---|---|
| `graduate_year` | year | Stored as text `"2020"`–`"2025"` |
| `GRADUATE_TYPE` | track detail | `technical college` / `strategy graduate` / `International graduate` |
| `qualification_name` | qualification | Whitespace-normalised — see §3 |
| `Gender_AR` | gender | `ذكر` / `أنثى` / `N/A` |
| `TRAINING_UNIT_NAME` | institution | 254 distinct |
| `TRAINING_UNIT_REGION` | region | 13 regions, prefixed `منطقة …` / `المنطقة …` |
| `TRAINING_MAJOR` | specialization | 343 distinct |
| `Total_graduates` | graduates | Integer in every row; no blanks, no text |
| `Total_CurrentJob` | employed | Integer in every row |

### University (`النتائج`, header on row 1)

| Source column | Used as | Notes |
|---|---|---|
| `graduation_year` | year | |
| `gender` | gender | `ذكر` / `أنثى` / `غيرمتوفر` |
| `University Name` | institution | 26 distinct |
| `Region` | region | 13 regions, bare names (no `منطقة` prefix) |
| `EducationLevel` | qualification | 9 distinct |
| `GeneralMajorName` → `NarrowMajorName` → `DetailedMajorName` → `MajorName` | major hierarchy | 2 / 10 / 27 / 88 distinct |
| `Total_Graduates` | graduates | |
| `Total_Employees` | employed | |

### Master occupations (header on **row 3**, not row 1)

Rows 1–2 are merged title banners. The parser reads the header from row 3 and
data from row 4, and uses 46 of the sheet's 64 columns:

| Group | Columns |
|---|---|
| Classification | `رمز/المجموعة الرئيسية`, `المجموعة الفرعية`, `المجموعة الثانوية`, `الوحدة`, `رمز المهنة`, `المهنة`, `Occupations` |
| Specialization | `رمز التخصص المهني`, `التخصص المهني`, `Occupational Specializations` (373 of 921 rows have one) |
| Classification aids | `نوع المهنة/التخصص المهني`, `المجموعة الوظيفية` |
| Sub-sectors | the 13 columns `السيارات` … `صناعات تحويلية أخرى`; a filled cell means the occupation serves that sector |
| Description | `ملخص المهنة`, `المهام الرئيسية للمهنة 1`–`5` |
| Levels | `مستوى المؤهل بحسب ISCED 11 …`, `مستوى المؤهل بحسب الإطار الوطني للمؤهلات`, `مستوى المهنة / التخصص المهني` |
| Education fields | `المجال التعليمي 1`–`4` |
| Skills | `المهارات الأساسية/القيادية/العامة/الفنية والمستوى الخاص بها` |

**Skills parsing.** Each skills cell is a bulleted run such as
`• الإلمام الرقمي - المستوى 2: متوسط • التخطيط - المستوى 3: متقدم`, with the
bullet character, tabs and spacing varying row to row. The parser splits on the
bullet and reads `name - المستوى N: label`. Entries that do not match that
shape are kept with their text intact and a null level, rather than dropped.

### Mining sector sheets (`قطاع التعدين 1` and `قطاع التعدين 2`)

**These sheets were authored by the project owner, not supplied with the source
data.** They are a worked example of the intended output shape for one sector,
and they are the reason this dashboard groups occupations the way it does. They
cover 77 mining-exclusive occupations at one row per (occupation,
specialization). Their `الجامعات/الكليات المطابقة` values and `الحالة` flags are
therefore owner-produced judgements, not ministry source data, and the UI
labels them as coming from that sheet.

They map occupations to the **universities and colleges whose programmes match
them** —
the "where is it taught" answer for mining occupations. Sheet 2 carries up to
four `المجال التعليمي` / `الجامعات/الكليات المطابقة` pairs per occupation;
sheet 1 carries one pair plus a `الحالة` status column.

Institution cells are newline-separated `اسم الجامعة – المنطقة` pairs and are
split into name/region.

**127 of 921 occupations have a programme match** — the sheets cover mining
occupations only, so the other 794 legitimately show "no match recorded".
The `الحالة` values are carried through and shown on the occupation page:

| Status | Count | Shown as |
|---|---|---|
| `مطابق` | 71 | normal |
| `غير متوفر - المستوى أدنى من الدبلوم` | 51 | normal |
| `تقديري - يحتاج مراجعة` | 5 | **flagged in the UI as an estimate needing review** |

Those 5 estimated matches are not silently presented as fact.

---

## 3. Cleaning decisions

Each of these is applied in `scripts/parse_sources.py`; none changes a number.

1. **Whitespace normalisation.** Source labels carry stray leading/trailing
   spaces, non-breaking spaces, zero-width characters and trailing newlines.
   `clean()` trims and collapses runs of whitespace. This matters: the
   vocational sheet writes `دبلوم` (3,558 rows), `دبلوم ` (454) and
   `  دبلوم ` (223) as three distinct strings for one qualification. Without
   this step they would appear as three separate categories.
2. **Arabic text is never transliterated or translated.** Labels render in
   Arabic exactly as written in the source.
3. **Region keys.** The two workbooks name the same regions differently — the
   vocational sheet writes `منطقة الرياض` / `المنطقة الشرقية`, the university
   sheet writes `الرياض` / `الشرقية`. A canonical key strips the
   `منطقة` / `المنطقة` prefix so the two tracks can be compared on one chart.
   The source spelling `منطقة الباحه` (with ه) is folded to `الباحة` (with ة)
   to match the university sheet. **Display labels keep their original form**;
   only the join key is normalised. Both sheets carry the same 13 regions.
4. **Gender.** `N/A` (vocational, 69 rows) and `غيرمتوفر` (university, 451
   rows) mean the same thing and are shown together as `غير متوفر`. They are
   kept visible, not dropped — 5,048 graduates sit in that bucket.
5. **Nothing is dropped.** 0 rows were skipped from either workbook. Every
   source row with a year and a numeric graduate count is in the output.

---

## 4. NQF mapping — and what could not be mapped

Levels come from the appendix table on **p.40** of
`nationalqualificationsframework.pdf` ("وفيما يلي توضيح للحد الأدنى من
السنوات، والساعات المعتمدة، وساعات الاتصال، ومتطلبات تسكينها وفقًا
للمستويات"), which lists levels 0–8 against qualification type.

**Mapped cleanly:**

| Source label | NQF level |
|---|---|
| `ما قبل المدرسة والطفولة المبكرة` | 0 |
| `التعليم الابتدائي أو ما يعادله` | 1 |
| `التعليم المتوسط أو ما يعادله` | 2 |
| `دبلوم مشارك أو ما يعادله` (and the `او` spelling variant) | 4 |
| `دبلوم متوسط أو ما يعادله` / `دبلوم متوسط` | 5 |
| `بكالوريوس أو ما يعادلها` / `بكالوريوس` / `دبلوم عال` | 6 |
| `ماجستير` | 7 |
| `دكتوراه` | 8 |

All **921 of 921** occupations in the master sheet map to an NQF level on
this table.

**Not on the p.40 table.** Four labels in the data are not qualification types
the framework places, and `NQF_MAP` deliberately does not contain them:

| Label | Where | Why it is not on p.40 |
|---|---|---|
| `دبلوم` | both sheets | The framework distinguishes الدبلوم المشارك (4), الدبلوم المتوسط (5) and الدبلوم المتقدم (5). A bare `دبلوم` does not say which. |
| `دبلوم معاهد ثانوي صناعي` | vocational | Spans التعليم الثانوي (3) and the diploma tiers (4–5). |
| `زمالة` | university | Fellowship. Not a qualification type in the table. |
| `أخرى` | university | Literally "other". Names no qualification at all. |

### Interim placements — assigned outside the framework, pending confirmation

⚠️ **Three of those four now carry a level the framework did not give them.**
On 2026-09-07 the project owner assigned them as a working assumption while
waiting on a confirmation email from the data owner. These are label-wide: they
apply wherever the label appears. (`أخرى` is handled row by row instead — see
the corrections below.)

| Label | Interim level | Graduates | Employed |
|---|---|---|---|
| `دبلوم` | **4** | 306,040 | 138,187 |
| `دبلوم معاهد ثانوي صناعي` | **3** | 20,875 | 3,099 |
| `زمالة` | **8** | 4 | 2 |

They live in `PROVISIONAL_NQF` in `scripts/parse_sources.py`, kept in a separate
dict from `NQF_MAP` on purpose: `NQF_MAP` is what the document states, this is a
decision made outside it. **To retire an entry once the email arrives**, move it
into `NQF_MAP` (or change the level here if the answer differs) and re-run the
parser — nothing else needs touching.

Nothing about this is silent. The NQF table tags each of those qualifications
`مبدئي` in gold, the two NQF charts append `*` to every level that draws on one,
and both views carry a note naming the label, the level and the count. About
**59% of all graduates sit on an interim placement**, so the flag matters:
`دبلوم` alone moves 306,040 graduates onto level 4.

### Level corrections — rows the owner identified

`أخرى` in the university sheet means the export did not know the
qualification, not that a strange one exists. On 2026-09-08 the project owner
identified the real qualification behind some of those rows, and
`LEVEL_CORRECTIONS` in `scripts/parse_sources.py` rewrites `EducationLevel`
for rows matching **all** of university + major + `أخرى`:

| University | Major | `أخرى` → | Rows | Graduates | Employed |
|---|---|---|---|---|---|
| جامعة شقراء | حماية البيئة | `دبلوم متوسط` (5) | 4 | 269 | 88 |
| جامعة شقراء | تقنية الهندسة الكهربائية | `دبلوم متوسط` (5) | 2 | 23 | 12 |
| جامعة الملك فهد للبترول والمعادن | العمارة | `بكالوريوس` (6) | 4 | 38 | 13 |

The match is scoped to a (university, major) pair rather than a university,
because جامعة شقراء had `أخرى` against two different majors and the owner
identified them in separate passes. A rule that matches nothing aborts the
parse, so a renamed major in a future export cannot fail silently. The
corrections ship in the payload and the NQF tab names them on screen, so a
moved number is never moved invisibly.

**Still `غير مصنّف`: `أخرى` only** — now 3 rows, 40 graduates, 32 employed,
0.007% of the total. Located in
`خريجي الجامعات للتخصصات بالمجال 0705 2020-2025.xlsx`, sheet `النتائج`,
column **E `EducationLevel`**:

| Major | University | Year | Graduates | Employed |
|---|---|---|---|---|
| `برامج ومؤهلات متعددة التخصصات تتضمن الهندسة والتصنيع والبناء` | جامعة الملك خالد | 2023 | 15 | 15 |
| `برامج ومؤهلات متعددة التخصصات تتضمن الهندسة والتصنيع والبناء` | جامعة جازان | 2023 | 11 | 11 |
| `التغذية وعلوم الأطعمة` | جامعة الملك خالد | 2025 | 14 | 6 |

`أخرى` names no qualification type, so these are left unclassified rather than
guessed. Correcting them is one more line each in `LEVEL_CORRECTIONS`.

The NQF charts on `#overview` and `#nqf` print both notes underneath the title,
recomputed from the rows currently in scope, so neither the interim placements
nor the unclassified remainder can be read off the chart without their caveat.

---

## 5. Verification

`scripts/verify_totals.py` re-reads the workbooks by unzipping the `.xlsx` and
walking the raw sheet XML — deliberately **not** via openpyxl — so a library
bug cannot produce the same wrong answer on both sides. All 10 checks pass:

| Check | Value |
|---|---|
| Vocational, total graduates | 366,974 |
| Vocational, total employed | 165,455 |
| Vocational, graduates in 2020 | 55,769 |
| Vocational, graduates in منطقة الرياض | 85,464 |
| University, total graduates | 185,596 |
| University, total employed | 97,120 |
| University, graduates in 2025 | 27,247 |
| University, graduates at بكالوريوس | 171,862 |
| University, graduates still recorded as `أخرى` | 40 |
| Occupation rows | 921 |
| **Sector employment rate** | **0.5232871398090476** |

The بكالوريوس figure is 171,862, not the sheet's own 171,824, because of the
level corrections in §4. The verifier does not special-case that: it reads the
corrections the payload declares and applies them to its own independent read
of the workbook, so a **declared** correction passes and an **undeclared**
divergence still fails. The corrections it applied are printed in its output.

The last one is the strongest check available: the university workbook's own
`تحليل هندسة المواد` sheet states `نسبة التوظيف لكامل القطاع (مرجع)` as
`0.5232871398090476`. The parsed data reproduces that figure to all 16
decimal places, from a total the sheet never states directly. The workbook
independently confirms the parse.

---

## 6. Brand identity

**mim.gov.sa was unreachable from the build environment** — the network egress
policy refused the connection (403 on the CONNECT tunnel). No brand value here
was read off the live site, and none was guessed. Everything comes from the
guidelines PDF the project owner supplied, or from artwork they sent directly.

### Colour — `MiM_Brand_Guidelines_Short_Version_v1.1.pdf`, p.30

Each value below is printed on p.30 as hex, RGB **and** HSL; all three agree.

| Token | Hex | RGB | HSL | Role |
|---|---|---|---|---|
| MIM Light Grey | `#E6E6E6` | 230,230,230 | 0°,0%,90% | primary |
| MIM Medium Grey | `#B3B3B3` | 179,179,179 | 0°,0%,70% | primary |
| MIM Dark Grey | `#666666` | 102,102,102 | 0°,0%,40% | primary |
| MIM Darkest Grey | `#1A1A1A` | 26,26,26 | 0°,0%,10% | primary |
| MIM Highlight Purple | `#413258` | 65,50,88 | 264°,43%,27% | accent |
| MIM Highlight Blue | `#1AD9C7` | 26,217,199 | 174°,88%,48% | accent |
| MIM Highlight Pink | `#BFA19F` | 191,161,159 | 4°,17%,69% | secondary |

Digital-only gradients, **p.32** (these differ from the print values):
purple `#825DEC → #3F3355`, pink `#BFA19F → #EFCAC7`, blue `#1AD9C7 → #66D6C7`.

**Usage ratio, p.34: 75% / 10% / 10% / 5%.** The guidelines are explicit that
the highlight colours appear "بنسب بسيطة جداً" — very sparingly. The dashboard
follows this: greys carry the chrome, purple and teal appear only on data
marks and active controls.

### Tint ramps — design-system swatches supplied by the project owner

The 50–900 ramps in `assets/brand.css` (`--mim-purple-*`, `--mim-blue-*`,
`--mim-black-*`) come from swatch images the owner provided, not from the PDF.

**Three deltas between those swatches and the guidelines PDF.** The PDF is
treated as canonical for the named brand colours; both are recorded:

| Colour | Guidelines PDF p.30 | Owner's swatch | Resolution |
|---|---|---|---|
| Darkest grey | `#1A1A1A` | `#757575` | PDF. `#757575` is step 400 of the Neutral black ramp — the swatch label appears to be off by a step. |
| Highlight pink | `#BFA19F` | `#BD9F9D` | PDF |
| Highlight blue | `#1AD9C7` | `#1CD7C5` (ramp 500) | PDF for the brand colour; the ramp keeps its own value |

### Typography — guidelines pp.26–34

- Primary, Arabic **and** English: **Lyon Arabic Regular** — headings and body
- Secondary, Arabic and English: **Diodrum Arabic Regular** — subheadings

Both are licensed commercial typefaces and are **not** redistributed in this
repository. `assets/brand.css` names them first in the font stack, so on any
machine with the licences installed the dashboard renders in the real brand
faces. Elsewhere it falls back to Noto Naskh Arabic (serif, for Lyon) and
Noto Sans Arabic (sans, for Diodrum), then to system Arabic faces.

**To install the real fonts:** drop the `.woff2`/`.otf` files into `assets/`
and add `@font-face` rules naming them `Lyon Arabic` and `Diodrum Arabic`.
The existing stacks will pick them up with no other change.

### Logo — supplied by the project owner as vector artwork

| File | Source artwork |
|---|---|
| `assets/mim-logo-primary.svg` | `MOI_S4_ regular version_V1` — full-colour bilingual lockup |
| `assets/mim-logo-flat-bilingual.svg` | `MOI_S4_ Flat version_V3` — two-tone bilingual |
| `assets/mim-logo-flat-en.svg` | `MOI_S4_ Flat version_V2` — English-only international lockup |
| `assets/mim-emblem.svg` | the primary file with its `viewBox` narrowed to frame the emblem |

All carry the wordmark as outlined paths — no `<text>` elements and no
`font-family` references — so they render identically without Lyon Arabic
installed. No path data or colour was altered; `mim-emblem.svg` differs from
`mim-logo-primary.svg` only in the `viewBox` attribute.

---

## 7. Chart colour

The MIM palette yields exactly **two** hues that remain distinguishable under
colour-vision deficiency: brand purple `#413258` and teal `#14B8B8` (blue ramp
600), at ΔE 35.8 deutan / 38.9 normal.

Every three-colour combination tried failed: brand pink against teal scores
ΔE 4.0 (protan), and mid-grey against teal ΔE 2.1. So **nothing in the
dashboard encodes more than two categories by colour at once.** The third
gender value and the unclassified NQF bucket are carried by a diagonal decal
plus a labelled axis entry, never by hue alone. Every bar is directly labelled
with its value, and the full data table is on the page — which also covers the
sub-3:1 contrast of teal on white.

NQF level is a magnitude, not a set of categories, so it uses a single-hue
purple ramp light→dark rather than categorical colours.

### Graduates and employed in the same chart

Every chart that counts graduates also draws the employed count, and neither
measure costs a colour. The employed are a **subset** of the graduates, so they
are drawn as a fill rather than as a second quantity beside them:

- **Bar charts** — one bar per row, the same width for both series, both
  starting at zero, the employed drawn on top at `barGap: -100%`. The graduates
  bar is the row's own hue mixed 32% into white, the employed bar is that hue at
  full strength. Same hue, two strengths: no second colour to decode and it
  survives greyscale. The employed number is printed inside its bar only where
  the bar is wide enough to hold it, measured against the plot width this chart
  actually got, and is in the tooltip either way along with the rate.
- **Trend lines** — the employed series repeats its track's hue as a dashed
  line with hollow markers. The overview trend therefore carries four lines in
  two hues, distinguished within each hue by line style rather than by a third
  and fourth colour that CVD would collapse.

Charts that count something other than graduates (occupations per NQF level,
skills per category) stay single-series.

Because both measures are now always on screen, the header's measure chips no
longer switch what is drawn — they are labelled `الترتيب حسب` and decide only
which measure the ranked lists and top-N charts are ordered by.

Two of the validator's checks fail against the brand colours and are accepted
deliberately: `#413258` sits outside the generic lightness band (0.351) and
below the chroma floor (0.067). Both are properties of the brand colour
itself — a dark, desaturated aubergine — and the brand takes precedence.

---

## 8. Linking occupations to graduate numbers

An occupation page shows graduate figures for the majors that teach it. The
bridge is the occupation's `المجال التعليمي` matched against the university
sheet's `DetailedMajorName`.

**Only exact string matches are linked.** 18 of the 41 education fields match a
university detailed major outright (`الكيمياء`, `الفيزياء`, `المناجم والتنقيب`,
`علوم الأرض`, `الإلكترونيات والأتمتة` and 13 others). The remaining 23 are left
unlinked and the page says so. Fuzzy matching was deliberately not used: a
near-miss would produce a graduate count that looks authoritative and is not.

**Vocational majors do not link at all** — zero of the 336 vocational
specialization names match an education field, because the two sheets use
different vocabularies entirely (`ميكانيكا السيارات` vs `الميكانيك والحرف
المعدنية`). A crosswalk table would be needed, and inventing one is out of
scope. Vocational majors therefore have their own detail pages driven by their
own data, with no occupation link.

---

## 9. Dashboard structure

Six tabs, all deep-linkable through `location.hash`, so any view can be
bookmarked or shared:

| Route | View |
|---|---|
| `#overview` | KPIs, year trend, gender, NQF distribution, regions, top specializations |
| `#voc` | all 336 vocational specializations, searchable |
| `#voc/detail/<i>` | one specialization: KPIs, year trend, by qualification, **where it is taught**, regions, gender |
| `#uni` → `#uni/n/g/<i>` → `#uni/d/n/<i>` → `#uni/m/d/<i>` | drill through the four-level major hierarchy: General → Narrow → Detailed → Major |
| `#uni/detail/<i>` | one major: KPIs, trend, by education level, **which universities teach it**, regions, gender, related occupations |
| `#occ` | all **548 occupations**, searchable by Arabic/English name, code or specialization, filterable by main group, NQF level and sub-sector |
| `#occ/<رمز المهنة>` | one occupation: its specializations, summary, full classification, main tasks, sub-sectors, education fields, skills with proficiency meters, matching universities, and graduate figures for linked majors |
| `#occ/<رمز المهنة>/<n>` | one specialization, opened in a window **over** its occupation: its own stats, skill-mix and university charts, summary, tasks, skills, sectors and fields |
| `#nqf` | the framework's levels with the qualifications, occupations and graduates at each |
| `#data` | the flat source table |

The year filter in the header applies to every view. The `الترتيب حسب` chips
set which measure ranks the top-N charts and the browse lists; both measures
are drawn regardless (see §7).

**Occupations are pages; a specialization is a window over its occupation.** The
occupation stays rendered behind, so closing returns you to your place in a list
of twenty-five rather than to the top of a fresh page. The window is still
driven by the route, so `#occ/722301/3` opens it directly and the URL stays
shareable, browser back closes it, and `Esc` / backdrop / `✕` all return to
`#occ/<رمز المهنة>`. `←` and `→` step between siblings. A specialization number
outside the occupation's range renders the occupation with a notice rather than
an error.

### The occupation hierarchy

The sheet's 921 rows are **548 occupations**. `رمز المهنة` repeats for 129 of
them because the occupation has one or more `التخصص المهني`, and the sheet
gives each specialization its own row, restating the occupation's identity
every time. Read flat, `أخصائي بيئي` (213301) looks like four occupations. It
is one occupation with three specializations.

The project owner's own `قطاع التعدين` sheet confirms the intended grain: 108
rows, 108 unique (occupation, specialization) pairs, zero duplicates on that
key, covering 77 occupations — one row per specialization, never one per
occupation alone.

The split is not cosmetic. Within a repeated code the identity columns agree —
the `المهنة` name matches in 128 of the 129 groups — while the descriptive
columns differ:

| Column | Differs within a repeated code |
|---|---|
| `ملخص المهنة` | 129 of 129 groups |
| `المهام الرئيسية` | 129 of 129 |
| skills | 128 of 129 |
| sub-sectors | 68 of 129 |
| education fields | 58 of 129 |
| `المجموعة الوظيفية` | 43 of 129 |

So the parent owns the classification and each child owns its own description.
`occupationTree` stores **indexes** into the flat `occupations` list rather than
copies: 61 KB for all 548 entries, and it cannot drift from the rows it
describes. Verified lossless — all 921 rows are referenced exactly once.

The row with no `التخصص المهني` is the occupation's own base description. Every
group in this data has one, so the `baseFromChild` fallback never fires; it is
kept so a future export lacking a base row degrades visibly rather than
silently borrowing a specialization's text.

Occupations are addressed by `رمز المهنة` in the URL and specializations by
their position within the occupation, so both are stable across re-parses.

---

## 10. Output format

`scripts/parse_sources.py` writes `dashboard-data.js` (a `window.MIM_DATA`
assignment) and `dashboard-data.json` (identical payload).

The dashboard loads the **`.js`** file via `<script src>`. This is deliberate:
`fetch()` of a local JSON file fails under `file://` in Chrome due to CORS on
`null` origins, which would break the double-click requirement. The `.json` is
kept for inspection and diffing.

Facts are index-encoded against dimension tables — each row is a list of small
integers plus its two measures.

**String interning.** The occupation records dominate the payload once the
skills, tasks and programme matches are included: 3.9 MB uncompressed, of which
2.1 MB was skill entries alone, because the same skill names recur across
hundreds of occupations and the 469 programme institution lists have only 17
distinct values between them. `intern_occupations()` replaces those repeated
strings with indexes into shared lexicons (`lexicon.skillNames`,
`skillLevels`, `sectors`, `fields`, `instLists`), which the dashboard resolves
back at load. This is lossless and takes the file from 5.7 MB to 3.1 MB.
