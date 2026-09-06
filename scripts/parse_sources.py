#!/usr/bin/env python3
"""
Parse the four MIM source documents into a single static data file that
dashboard.html reads directly.

    python3 scripts/parse_sources.py

Writes:
    data/dashboard-data.js    window.MIM_DATA = {...}   (loaded via <script src>)
    data/dashboard-data.json  same payload, for inspection/diffing

Design notes
------------
* Nothing is invented. Every number emitted is a sum of cells from the source
  workbooks. Where a value cannot be mapped cleanly (a qualification name that
  the National Qualifications Framework does not name unambiguously, say) it is
  emitted as null and recorded in the `unmapped` report rather than guessed.
* Facts are index-encoded against dimension tables to keep the payload small:
  a row becomes a list of small integers plus its two measures.
* Arabic label text is preserved exactly as it appears in the source, apart
  from whitespace normalisation. Nothing is transliterated or translated.
"""

import json
import re
import sys
from collections import Counter, OrderedDict
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl is required:  pip install openpyxl")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

VOCATIONAL_XLSX = DATA / "خريجي التعليم المهني 2020-2025.xlsx"
UNIVERSITY_XLSX = DATA / "خريجي الجامعات للتخصصات بالمجال 0705 2020-2025.xlsx"
MASTER_XLSX = DATA / "260218 Final Master Sheet with Occupations in EN.xlsx"


# ---------------------------------------------------------------------------
# National Qualifications Framework
# ---------------------------------------------------------------------------
# Transcribed from data/nationalqualificationsframework.pdf, 3rd edition
# (1447H / 2026), appendix table on p.40: "وفيما يلي توضيح للحد الأدنى من
# السنوات، والساعات المعتمدة، وساعات الاتصال، ومتطلبات تسكينها وفقًا للمستويات".
# That table is the authority for which qualification type sits at which level.
NQF_LEVELS = [
    {"level": 0, "ar": "ما قبل المدرسة والطفولة المبكرة", "en": "Pre-school & early childhood"},
    {"level": 1, "ar": "التعليم الابتدائي أو ما يعادله", "en": "Primary education or equivalent"},
    {"level": 2, "ar": "التعليم المتوسط أو ما يعادله", "en": "Intermediate education or equivalent"},
    {"level": 3, "ar": "التعليم الثانوي أو ما يعادله", "en": "Secondary education or equivalent"},
    {"level": 4, "ar": "الدبلوم المشارك أو ما يعادله", "en": "Associate diploma or equivalent"},
    {"level": 5, "ar": "الدبلوم المتوسط / المتقدم أو ما يعادله", "en": "Intermediate / advanced diploma"},
    {"level": 6, "ar": "البكالوريوس أو الدبلوم العالي أو ما يعادله", "en": "Bachelor's or higher diploma"},
    {"level": 7, "ar": "الماجستير أو البكالوريوس المهني أو ما يعادله", "en": "Master's or professional bachelor's"},
    {"level": 8, "ar": "الدكتوراه أو ما يعادلها", "en": "Doctorate or equivalent"},
]

# Qualification label (as written in each source) -> NQF level.
# Only mappings the p.40 table states outright are listed. Anything absent
# here is emitted as null and reported, never guessed into a level.
NQF_MAP = {
    # master occupations sheet, column "مستوى المؤهل بحسب الإطار الوطني للمؤهلات"
    "ما قبل المدرسة والطفولة المبكرة": 0,
    "التعليم الابتدائي أو ما يعادله": 1,
    "التعليم المتوسط أو ما يعادله": 2,
    "دبلوم مشارك أو ما يعادله": 4,
    "دبلوم مشارك او ما يعادله": 4,          # أو/او spelling variant in source
    "دبلوم متوسط أو ما يعادله": 5,
    "بكالوريوس أو ما يعادلها": 6,
    # university sheet, column "EducationLevel"
    "دبلوم متوسط": 5,
    "دبلوم عال": 6,                          # الدبلوم العالي -> level 6
    "بكالوريوس": 6,
    "ماجستير": 7,
    "دكتوراه": 8,
    "دبلوم مشارك": 4,
    # vocational sheet, column "qualification_name"
    # "دبلوم" on its own and "دبلوم معاهد ثانوي صناعي" are deliberately absent:
    # see AMBIGUOUS below.
}

# Labels that appear in the data but that the framework does not pin to a
# single level. Recorded so the dashboard can show them as "غير مصنّف" and the
# README can explain why, rather than silently bucketing them.
AMBIGUOUS = {
    "دبلوم": "The framework distinguishes الدبلوم المشارك (level 4), الدبلوم المتوسط "
             "(level 5) and الدبلوم المتقدم (level 5). A bare دبلوم does not identify which.",
    "دبلوم معاهد ثانوي صناعي": "A secondary industrial institute diploma. The framework "
             "names التعليم الثانوي (level 3) and the diploma tiers (4-5) separately; the "
             "source label spans both and is not resolvable from the sheet alone.",
    "أخرى": "Literally 'other'. No qualification type given.",
    "زمالة": "Fellowship. Not named as a qualification type in the p.40 table.",
}


def clean(value):
    """Trim and collapse whitespace. Preserves the Arabic text itself."""
    if value is None:
        return None
    text = str(value).replace("​", "").replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def canon_region(name):
    """
    Canonical region key so the two datasets can be compared.

    The vocational sheet writes 'منطقة الرياض' / 'المنطقة الشرقية' where the
    university sheet writes 'الرياض' / 'الشرقية'. Display labels keep their
    original form; only this key is normalised.
    """
    if not name:
        return None
    key = re.sub(r"^المنطقة\s+", "", re.sub(r"^منطقة\s+", "", name)).strip()
    return key.replace("الباحه", "الباحة")


class Dim:
    """An ordered dimension table: label -> integer index."""

    def __init__(self):
        self._index = OrderedDict()

    def id(self, label):
        if label is None:
            return None
        if label not in self._index:
            self._index[label] = len(self._index)
        return self._index[label]

    def labels(self):
        return list(self._index.keys())


def sheet_rows(path, sheet, header_row=1):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[sheet]
    rows = list(ws.iter_rows(values_only=True))
    header = [clean(c) for c in rows[header_row - 1]]
    body = [r for r in rows[header_row:] if any(c is not None for c in r)]
    return header, body


def parse_vocational(report):
    header, body = sheet_rows(VOCATIONAL_XLSX, "Sheet1")
    col = {name: i for i, name in enumerate(header)}

    dims = {k: Dim() for k in
            ("year", "track", "qualification", "gender", "institution", "region", "major")}
    facts, skipped = [], 0

    for row in body:
        year = clean(row[col["graduate_year"]])
        grads = row[col["Total_graduates"]]
        employed = row[col["Total_CurrentJob"]]
        if year is None or not isinstance(grads, (int, float)):
            skipped += 1
            continue
        qualification = clean(row[col["qualification_name"]])
        region = clean(row[col["TRAINING_UNIT_REGION"]])
        facts.append([
            dims["year"].id(year),
            dims["track"].id(clean(row[col["GRADUATE_TYPE"]])),
            dims["qualification"].id(qualification),
            dims["gender"].id(clean(row[col["Gender_AR"]])),
            dims["institution"].id(clean(row[col["TRAINING_UNIT_NAME"]])),
            dims["region"].id(region),
            dims["major"].id(clean(row[col["TRAINING_MAJOR"]])),
            int(grads),
            int(employed) if isinstance(employed, (int, float)) else 0,
        ])

    report["vocational"] = {
        "source_rows": len(body),
        "parsed_rows": len(facts),
        "skipped_rows": skipped,
        "total_graduates": sum(f[7] for f in facts),
        "total_employed": sum(f[8] for f in facts),
    }
    return dims, facts


def parse_university(report):
    header, body = sheet_rows(UNIVERSITY_XLSX, "النتائج")
    col = {name: i for i, name in enumerate(header)}

    dims = {k: Dim() for k in
            ("year", "gender", "university", "region", "level",
             "generalMajor", "narrowMajor", "detailedMajor", "major")}
    facts, skipped = [], 0

    for row in body:
        year = clean(row[col["graduation_year"]])
        grads = row[col["Total_Graduates"]]
        employed = row[col["Total_Employees"]]
        if year is None or not isinstance(grads, (int, float)):
            skipped += 1
            continue
        facts.append([
            dims["year"].id(year),
            dims["gender"].id(clean(row[col["gender"]])),
            dims["university"].id(clean(row[col["University Name"]])),
            dims["region"].id(clean(row[col["Region"]])),
            dims["level"].id(clean(row[col["EducationLevel"]])),
            dims["generalMajor"].id(clean(row[col["GeneralMajorName"]])),
            dims["narrowMajor"].id(clean(row[col["NarrowMajorName"]])),
            dims["detailedMajor"].id(clean(row[col["DetailedMajorName"]])),
            dims["major"].id(clean(row[col["MajorName"]])),
            int(grads),
            int(employed) if isinstance(employed, (int, float)) else 0,
        ])

    report["university"] = {
        "source_rows": len(body),
        "parsed_rows": len(facts),
        "skipped_rows": skipped,
        "total_graduates": sum(f[9] for f in facts),
        "total_employed": sum(f[10] for f in facts),
    }
    return dims, facts


def parse_master(report):
    """Occupations, with their NQF level and education fields."""
    header, body = sheet_rows(MASTER_XLSX, "قائمة المهن المشمولة Master", header_row=3)
    col = {name: i for i, name in enumerate(header) if name}

    c_ar = col["المهنة"]
    c_en = col["Occupations"]
    c_nqf = col["مستوى المؤهل بحسب الإطار الوطني للمؤهلات"]
    c_isced = col["مستوى المؤهل بحسب ISCED 11 والمطبق في التصنيف السعودي للمهن"]
    c_group = col["المجموعة الرئيسية"]
    fields = [col[f"المجال التعليمي {n}"] for n in (1, 2, 3, 4)]

    occupations, unmapped = [], Counter()
    for row in body:
        name_ar = clean(row[c_ar])
        if not name_ar:
            continue
        nqf_label = clean(row[c_nqf])
        level = NQF_MAP.get(nqf_label)
        if nqf_label and level is None:
            unmapped[nqf_label] += 1
        occupations.append({
            "ar": name_ar,
            "en": clean(row[c_en]),
            "group": clean(row[c_group]),
            "isced": clean(row[c_isced]),
            "nqfLabel": nqf_label,
            "nqfLevel": level,
            "fields": [f for f in (clean(row[i]) for i in fields) if f],
        })

    by_level = Counter(o["nqfLevel"] for o in occupations)
    report["master"] = {
        "source_rows": len(body),
        "occupations": len(occupations),
        "mapped_to_nqf": sum(1 for o in occupations if o["nqfLevel"] is not None),
        "unmapped_labels": dict(unmapped),
        "by_nqf_level": {str(k): v for k, v in sorted(by_level.items(), key=lambda x: (x[0] is None, x[0]))},
    }
    return occupations


def nqf_for_labels(labels):
    """Map a dimension's labels to NQF levels, flagging what will not map."""
    out, unresolved = [], []
    for label in labels:
        level = NQF_MAP.get(label)
        out.append(level)
        if level is None:
            unresolved.append(label)
    return out, unresolved


def main():
    for path in (VOCATIONAL_XLSX, UNIVERSITY_XLSX, MASTER_XLSX):
        if not path.exists():
            sys.exit(f"missing source file: {path}")

    report = {}
    voc_dims, voc_facts = parse_vocational(report)
    uni_dims, uni_facts = parse_university(report)
    occupations = parse_master(report)

    voc_qual_levels, voc_unresolved = nqf_for_labels(voc_dims["qualification"].labels())
    uni_level_levels, uni_unresolved = nqf_for_labels(uni_dims["level"].labels())

    payload = {
        "meta": {
            "generatedBy": "scripts/parse_sources.py",
            "years": sorted({l for l in voc_dims["year"].labels()} |
                            {l for l in uni_dims["year"].labels()}),
            "sources": {
                "vocational": VOCATIONAL_XLSX.name,
                "university": UNIVERSITY_XLSX.name,
                "master": MASTER_XLSX.name,
                "nqf": "nationalqualificationsframework.pdf",
            },
            "scope": {
                "vocational": {
                    "ar": "خريجو التعليم المهني والتقني",
                    "en": "Vocational and technical education graduates",
                },
                "university": {
                    "ar": "خريجو الجامعات السعودية في التخصصات المرتبطة بقطاع الصناعة والتعدين",
                    "en": "Saudi university graduates in specializations related to the "
                          "industry and mining sector (request NLODM-4080). This is NOT all "
                          "university graduates: the sheet covers two general fields only.",
                },
            },
        },
        "nqf": {
            "levels": NQF_LEVELS,
            "source": "nationalqualificationsframework.pdf, 3rd edition, appendix table p.40",
            "ambiguous": AMBIGUOUS,
        },
        "vocational": {
            "dims": {k: v.labels() for k, v in voc_dims.items()},
            "regionKeys": [canon_region(r) for r in voc_dims["region"].labels()],
            "qualificationNqf": voc_qual_levels,
            "cols": ["year", "track", "qualification", "gender",
                     "institution", "region", "major", "graduates", "employed"],
            "rows": voc_facts,
        },
        "university": {
            "dims": {k: v.labels() for k, v in uni_dims.items()},
            "regionKeys": [canon_region(r) for r in uni_dims["region"].labels()],
            "levelNqf": uni_level_levels,
            "cols": ["year", "gender", "university", "region", "level", "generalMajor",
                     "narrowMajor", "detailedMajor", "major", "graduates", "employed"],
            "rows": uni_facts,
        },
        "occupations": occupations,
    }

    json_path = DATA / "dashboard-data.json"
    js_path = DATA / "dashboard-data.js"
    blob = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    json_path.write_text(blob, encoding="utf-8")
    js_path.write_text("window.MIM_DATA = " + blob + ";\n", encoding="utf-8")

    # ---- verification report -------------------------------------------
    print("=" * 68)
    print("PARSE REPORT")
    print("=" * 68)
    for name in ("vocational", "university"):
        r = report[name]
        rate = r["total_employed"] / r["total_graduates"] if r["total_graduates"] else 0
        print(f"\n{name}:")
        print(f"  source rows      {r['source_rows']:,}")
        print(f"  parsed rows      {r['parsed_rows']:,}   (skipped {r['skipped_rows']})")
        print(f"  total graduates  {r['total_graduates']:,}")
        print(f"  total employed   {r['total_employed']:,}")
        print(f"  employment rate  {rate:.10f}")

    m = report["master"]
    print(f"\nmaster occupations:")
    print(f"  rows             {m['source_rows']:,}")
    print(f"  occupations      {m['occupations']:,}")
    print(f"  mapped to NQF    {m['mapped_to_nqf']:,}")
    print(f"  by NQF level     {m['by_nqf_level']}")
    if m["unmapped_labels"]:
        print(f"  UNMAPPED labels  {m['unmapped_labels']}")

    if voc_unresolved or uni_unresolved:
        print("\nqualifications with no unambiguous NQF level (shown as غير مصنّف):")
        for label in voc_unresolved:
            print(f"  [vocational] {label}")
        for label in uni_unresolved:
            print(f"  [university] {label}")

    print(f"\nwrote {js_path.relative_to(ROOT)}  ({js_path.stat().st_size:,} bytes)")
    print(f"wrote {json_path.relative_to(ROOT)}  ({json_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
