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
data from row 4. Columns used: `المهنة`, `Occupations`, `المجموعة الرئيسية`,
`مستوى المؤهل بحسب ISCED 11 …`,
`مستوى المؤهل بحسب الإطار الوطني للمؤهلات`, and `المجال التعليمي 1`–`4`.

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

**NOT mapped — shown as `غير مصنّف`, never guessed:**

| Label | Where | Why |
|---|---|---|
| `دبلوم` | both sheets | The framework distinguishes الدبلوم المشارك (4), الدبلوم المتوسط (5) and الدبلوم المتقدم (5). A bare `دبلوم` does not say which. |
| `دبلوم معاهد ثانوي صناعي` | vocational | Spans التعليم الثانوي (3) and the diploma tiers (4–5); not resolvable from the sheet. |
| `أخرى` | university | Literally "other". No qualification type given. |
| `زمالة` | university | Fellowship. Not a qualification type in the p.40 table. |

⚠️ **This is a large share of the data.** 327,289 graduates — about 59% of the
552,570 total — carry a qualification the framework does not pin to one level,
overwhelmingly the bare `دبلوم` in the vocational sheet. The dashboard shows
this as a distinct hatched bar with its own note rather than distributing it
across levels. **If the vocational data can be re-exported with the diploma
tier spelled out (مشارك / متوسط / متقدم), that single change would place the
majority of these graduates on the framework.**

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
| University, graduates at بكالوريوس | 171,824 |
| Occupation rows | 921 |
| **Sector employment rate** | **0.5232871398090476** |

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

Two of the validator's checks fail against the brand colours and are accepted
deliberately: `#413258` sits outside the generic lightness band (0.351) and
below the chroma floor (0.067). Both are properties of the brand colour
itself — a dark, desaturated aubergine — and the brand takes precedence.

---

## 8. Output format

`scripts/parse_sources.py` writes `dashboard-data.js` (a `window.MIM_DATA`
assignment) and `dashboard-data.json` (identical payload).

The dashboard loads the **`.js`** file via `<script src>`. This is deliberate:
`fetch()` of a local JSON file fails under `file://` in Chrome due to CORS on
`null` origins, which would break the double-click requirement. The `.json` is
kept for inspection and diffing.

Facts are index-encoded against dimension tables — each row is a list of small
integers plus its two measures — which keeps the payload at ~628 KB for 10,921
source rows.
