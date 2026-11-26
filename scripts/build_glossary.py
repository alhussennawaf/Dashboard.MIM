#!/usr/bin/env python3
"""
Build english-glossary.xlsx: every English term written for this dashboard,
laid out so a person can approve it.

    python3.13 scripts/build_glossary.py

What it does NOT contain, on purpose:

* The 921 occupation names and their specializations, the framework's level
  names, and the scope sentence. Those are English in their own sources and
  are read from them, so they are nobody's to approve here.
* Anything mechanical. ٠١٢٣٤٥٦٧٨٩ are the same numbers in another script and
  the page converts them itself; a row asking someone to approve «١٠٪ – ٢٥٪»
  → "10% – 25%" wastes the one thing a reviewer has. The guard at the bottom
  refuses to write the file if such a row ever appears again.

Two sheets, because two different people own the answers: the terminology a
ministry owns, and the interface wording, which wants an editor and not a
classification authority.
"""

import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

try:
    import openpyxl
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
except ImportError:
    sys.exit("openpyxl is required:  python3.13 -m pip install openpyxl")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "english-glossary.xlsx"

ARABIC_LETTER = re.compile(r"[ء-ي]")
ARABIC_DIGIT = re.compile(r"[٠-٩]")

# Terminology a ministry owns, in the order a reviewer should meet it.
TERM_KINDS = [
    "Occupation (Workforce Data)", "Skill", "University specialization",
    "Vocational specialization", "Education field", "Industrial sector",
    "Region", "City", "City or town", "University", "College or institute",
    "College or institute (name part)", "Controlled vocabulary",
]

# Small closed vocabularies that read as interface text but are classification
# terms: a ministry decides whether نطاق is "Nitaqat band", not an editor.
CONTROLLED = {
    "سعودي", "غير سعودي", "ذكر", "أنثى", "عالية", "متوسطة", "منخفضة",
    "مهارات عالية", "مهارات متوسطة", "أساسية", "أساسية داعمة", "داعمة",
    "كبيرة", "صغيرة", "متناهية الصغر", "اخضر", "بلاتيني", "احمر", "مستبعد",
    "الإنتاج", "الإنشاء", "متوقف", "بكالوريوس", "ماجستير", "دكتوراه", "دبلوم",
    "دبلوم عالي", "دبلوم متوسط", "دبلوم عال", "دبلوم مشارك", "زمالة",
    "ثانوي صناعي", "دبلوم معاهد ثانوي صناعي", "غير مصنف", "غير مصنّف",
    "غير مسجّلة", "لا يوجد", "المجموعة الرئيسية", "المجموعة الفرعية",
    "المجموعة الثانوية", "الوحدة", "النطاق", "مستوى المهارة", "نوع المهنة",
    "تصنيف المهنة", "مستوى المؤهل", "مستوى الإطار", "الجنسية", "الجنس",
    # The major groups of التصنيف السعودي الموحد للمهن. These read like page
    # headings but they are the classification's own titles.
    "المديرون", "الاختصاصيّون", "الفنيّون والاختصاصيّون المساعدون",
    "عاملو الدعم المكتبي", "عاملو الخدمات والمبيعات", "عاملو الحرف ومن يرتبط بهم",
    "مشغّلو المصانع والآلات وعاملو التجميع", "المهن الأولية",
    "العاملون في القوات المسلحة",
    "العاملون المهرة في الزراعة والغابات ومزارع الأسماك",
    # Nitaqat bands below the colour, and the two classifications by name.
    "اخضر منخفض", "اخضر متوسط", "اخضر مرتفع", "اخضر صغير (فئة أ)",
    "احمر صغير (فئة أ)", "( غير مصنف )", "النطاق لفرعي",
    "التصنيف السعودي الموحّد للمهن", "الإطار الوطني للمؤهلات",
}


def load_dictionary():
    """The dictionary is JavaScript, so node reads it rather than a parser."""
    js = (
        "global.window={};require(%s);"
        "console.log(JSON.stringify({en:window.MIM_EN,kind:window.MIM_INST_KIND||{}}));"
        % json.dumps(str(ROOT / "data" / "i18n.js"))
    )
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    if out.returncode:
        sys.exit("could not read data/i18n.js:\n" + out.stderr.strip())
    return json.loads(out.stdout)


def classify(data, centre):
    """Which list a term belongs to, and how much rides on getting it right."""
    def names(*lists):
        s = set()
        for l in lists:
            s.update(x for x in l if x)
        return s

    occ_master = names(o["ar"] for o in data["occupations"])
    centre_occ = names(centre["occ"]["name"])
    skills = names(data["lexicon"]["skillNames"])
    voc = names(data["vocational"]["dims"]["major"])
    uni = names(data["university"]["dims"]["major"],
                data["university"]["dims"]["generalMajor"],
                data["university"]["dims"]["narrowMajor"],
                data["university"]["dims"]["detailedMajor"])
    unis = names(data["university"]["dims"]["university"])
    insts = names(data["vocational"]["dims"]["institution"],
                  (x["name"] for x in sum(data["lexicon"]["instLists"], [])))
    fields = names(data["lexicon"]["fields"])
    sectors = names(data["lexicon"]["sectors"], centre["dims"]["sector"])
    regions = names(data["vocational"]["dims"]["region"],
                    data["university"]["dims"]["region"], centre["dims"]["region"])
    cities = names(centre["dims"]["city"])
    # The towns inside a college's name are place names too, and belong with
    # the terminology rather than with the interface wording. They are read
    # off the institution names the same way the page reads them: a kind,
    # then the preposition ب or في, then the place.
    places = set()
    for name in insts:
        m = re.match(r"^(.*?)\s+(?:ب|في\s+)(.+)$", name)
        if m:
            places.add(m.group(2).split("/")[0].strip())
            places.add(m.group(2).split("/")[0].strip().lstrip("ب"))

    skill_use = defaultdict(int)
    for o in data["occupations"]:
        for k in ("technical", "basic", "general", "leadership"):
            for s in o["skills"].get(k) or []:
                skill_use[data["lexicon"]["skillNames"][s[0]]] += 1

    occ_workers, city_workers = defaultdict(int), defaultdict(int)
    per_occ = defaultdict(int)
    for cell in centre["occ"]["cells"]:
        per_occ[cell[0]] += cell[3]
    for i, n in enumerate(centre["occ"]["name"]):
        occ_workers[n] += per_occ.get(i, 0)
    per_city = defaultdict(int)
    for r in centre["cityCells"]:
        per_city[r[0]] += r[3]
    for i, n in enumerate(centre["dims"]["city"]):
        city_workers[n] = per_city.get(i, 0)

    def where(ar):
        if ar in CONTROLLED:  return "Controlled vocabulary", ""
        if ar in centre_occ:  return "Occupation (Workforce Data)", occ_workers.get(ar, 0)
        if ar in occ_master:  return "Occupation (master sheet)", ""
        if ar in skills:      return "Skill", skill_use.get(ar, 0)
        if ar in voc:         return "Vocational specialization", ""
        if ar in uni:         return "University specialization", ""
        if ar in unis:        return "University", ""
        if ar in insts:       return "College or institute", ""
        if ar in fields:      return "Education field", ""
        if ar in sectors:     return "Industrial sector", ""
        if ar in regions:     return "Region", ""
        if ar in cities:      return "City", city_workers.get(ar, 0)
        if ar in places:      return "City or town", ""
        return "Interface text", ""

    return where


def mechanical(ar, en):
    """True when the two sides say the same thing in different scripts."""
    same = ARABIC_DIGIT.sub(lambda m: str(ord(m.group()) - 0x0660), ar)
    same = same.replace("٪", "%").replace("–", "-")
    return same.replace(" ", "") == en.replace("–", "-").replace(" ", "")


def build_rows(dictionary, where):
    """One row per English term; the source's spellings travel together, so a
       college spelled five ways is one decision and not five."""
    grouped = defaultdict(lambda: {"variants": [], "kind": None, "weight": ""})
    dropped = []
    items = list(dictionary["en"].items())
    items += [(k, v) for k, v in dictionary["kind"].items()]
    for ar, en in items:
        if not ARABIC_LETTER.search(ar):
            dropped.append(("no Arabic letter in it", ar, en))
            continue
        if ar.strip() == en.strip():
            dropped.append(("identical on both sides", ar, en))
            continue
        if mechanical(ar, en):
            dropped.append(("a conversion, not a translation", ar, en))
            continue
        kind, weight = where(ar)
        if ar in dictionary["kind"]:
            kind = "College or institute (name part)"
        g = grouped[(en, kind)]
        g["variants"].append(ar)
        g["kind"] = kind
        if isinstance(weight, int) and weight > (g["weight"] or 0):
            g["weight"] = weight
    rows = []
    for (en, kind), g in grouped.items():
        # The list is carried whole. Some keys contain " · " themselves, so a
        # joined string cannot be split back into the spellings it came from:
        # the first run of this guard tore «المتوظفون · Employed» in two and
        # reported an English word as an untranslated Arabic term.
        rows.append({"en": en, "kind": kind, "weight": g["weight"],
                     "ar": g["variants"][0], "all": g["variants"],
                     "variants": " · ".join(g["variants"][1:])})
    rows.sort(key=lambda r: (TERM_KINDS.index(r["kind"]) if r["kind"] in TERM_KINDS else 99,
                             -(r["weight"] if isinstance(r["weight"], int) else -1),
                             r["en"]))
    return rows, dropped


HEAD = ["#", "المصطلح العربي", "English", "النوع", "الوزن",
        "صيغ المصدر الأخرى", "معتمد؟", "تصحيح مقترح", "ملاحظة"]
WIDTHS = [6, 42, 42, 26, 9, 34, 10, 28, 28]


def write_sheet(ws, note, rows):
    ws.sheet_view.rightToLeft = True
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(HEAD))
    ws.cell(row=1, column=1, value=note).alignment = Alignment(wrap_text=True, vertical="top")
    ws.cell(row=1, column=1).font = Font(size=10, color="444444")
    ws.row_dimensions[1].height = 52
    ws.append([])
    ws.append(HEAD)
    fill = PatternFill("solid", fgColor="413258")
    for c in range(1, len(HEAD) + 1):
        cell = ws.cell(row=3, column=c)
        cell.font = Font(bold=True, color="FFFFFF", size=11)
        cell.fill = fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[3].height = 26
    ws.freeze_panes = "A4"
    for i, r in enumerate(rows, 1):
        ws.append([i, r["ar"], r["en"], r["kind"], r["weight"], r["variants"], "", "", ""])
    thin = Side(style="thin", color="DDDDDD")
    for row in ws.iter_rows(min_row=3, max_row=3 + len(rows), max_col=len(HEAD)):
        for cell in row:
            cell.border = Border(left=thin, right=thin, top=thin, bottom=thin)
    for row in ws.iter_rows(min_row=4, max_row=3 + len(rows), max_col=len(HEAD)):
        row[2].alignment = Alignment(horizontal="left")
        row[0].alignment = Alignment(horizontal="center")
        row[4].alignment = Alignment(horizontal="center")
    for col, w in zip("ABCDEFGHI", WIDTHS):
        ws.column_dimensions[col].width = w
    ws.auto_filter.ref = "A3:I%d" % (3 + len(rows))


def main():
    data = json.loads((ROOT / "data" / "dashboard-data.json").read_text(encoding="utf-8"))
    centre = json.loads((ROOT / "data" / "center-workforce.json").read_text(encoding="utf-8"))
    dictionary = load_dictionary()
    rows, dropped = build_rows(dictionary, classify(data, centre))

    # What was left out, said out loud. A row a reviewer cannot decide is not
    # an error to stop the build over -- a new numeral entry should simply not
    # appear in the sheet -- but dropping it silently is how «١٠٪ – ٢٥٪» got
    # in front of someone in the first place, so every omission is printed.
    if dropped:
        print("left out, nothing here for a reviewer to decide:")
        for why, ar, en in dropped:
            print("  %-34s %s -> %s" % (why, ar, en))
        print()

    # A post-condition, not a gate: the filter above already removed these, so
    # this firing would mean the filter is broken, not the dictionary.
    for r in rows:
        for ar in r["all"]:
            assert ARABIC_LETTER.search(ar) and ar.strip() != r["en"].strip() \
                and not mechanical(ar, r["en"]), \
                "filter let through %r -> %r" % (ar, r["en"])

    terms = [r for r in rows if r["kind"] in TERM_KINDS]
    copy = [r for r in rows if r["kind"] not in TERM_KINDS]

    wb = openpyxl.Workbook()
    write_sheet(
        wb.active,
        "المصطلحات التي تحتاج اعتمادًا رسميًا: أسماء المهن والمهارات والتخصصات "
        "والجهات والمدن والقطاعات. «الوزن» عدد العاملين للمهنة أو المدينة، وعدد "
        "المهن التي تستخدم المهارة، فابدأ من الأعلى. أسماء المهن الـ921 وتخصصاتها "
        "ومستويات الإطار الوطني غير مدرجة: هي إنجليزية في مصدرها وتُقرأ منه.",
        terms)
    wb.active.title = "مصطلحات للاعتماد"
    ws2 = wb.create_sheet("نصوص الواجهة")
    write_sheet(
        ws2,
        "عناوين وتلميحات وأزرار اللوحة. هذه صياغة تحريرية لا مصطلحات رسمية، "
        "فمراجعتها لغوية لا تصنيفية.",
        copy)
    wb.save(OUT)
    print("wrote %s" % OUT.name)
    print("  %-22s %d" % ("terms for approval", len(terms)))
    print("  %-22s %d" % ("interface copy", len(copy)))
    print("  %-22s %d" % ("rows in total", len(rows)))
    kept = sum(len(r["all"]) for r in rows)
    print("  %-22s %d" % ("source spellings kept", kept))
    print("  dropped as mechanical, identical or numeric: %d"
          % (len(dictionary["en"]) + len(dictionary["kind"]) - kept))


if __name__ == "__main__":
    main()
