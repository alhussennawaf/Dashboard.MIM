#!/usr/bin/env python3
"""
Parse the four MIM source documents into a single static data file that
index.html reads directly.

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

# CONFIRMED BY THE DATA OWNER, NOT READ OFF p.40.
# Three of the labels above are not qualification types the p.40 table places.
# The project owner proposed a level for each on 2026-09-07 and confirmed all
# three on 2026-09-09, so they are no longer provisional. They stay in their own
# dict rather than moving into NQF_MAP because the provenance differs: NQF_MAP is
# transcribed from the document, these come from the data owner. The dashboard
# says so in a footnote instead of the warning it carried while they were open.
OWNER_ASSIGNED_NQF = {
    "دبلوم": 4,
    "دبلوم معاهد ثانوي صناعي": 3,
    "زمالة": 8,
}
# "أخرى" is deliberately not here: it names no qualification, so there is
# nothing to place. It stays غير مصنّف wherever it survives the corrections
# below. In the university sheet it starts as 13 rows, 370 graduates.


# The sheet records "أخرى" where it does not know the qualification, and the
# project owner identified the actual one for some of those rows. Each rule
# rewrites EducationLevel for rows matching ALL of its keys, so a university
# that has "أخرى" against several majors is corrected only where the owner
# said so. Applied at parse time and counted in the run report; a rule that
# matches nothing is an error, so a renamed major cannot fail silently.
LEVEL_CORRECTIONS = [
    {"from": "أخرى", "university": "جامعة شقراء",
     "major": "حماية البيئة", "to": "دبلوم متوسط"},
    {"from": "أخرى", "university": "جامعة شقراء",
     "major": "تقنية الهندسة الكهربائية", "to": "دبلوم متوسط"},
    {"from": "أخرى", "university": "جامعة الملك فهد للبترول والمعادن",
     "major": "العمارة", "to": "بكالوريوس"},
]


def corrected_level(level, university, major):
    """EducationLevel for one row, after the owner's corrections."""
    for rule in LEVEL_CORRECTIONS:
        if (level == rule["from"] and university == rule["university"]
                and major == rule["major"]):
            rule["hits"] = rule.get("hits", 0) + 1
            return rule["to"]
    return level


def nqf_level(label):
    """The p.40 level for a label, else the owner-assigned one, else None."""
    if label in NQF_MAP:
        return NQF_MAP[label]
    return OWNER_ASSIGNED_NQF.get(label)


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
        university = clean(row[col["University Name"]])
        major = clean(row[col["MajorName"]])
        level = corrected_level(clean(row[col["EducationLevel"]]), university, major)
        facts.append([
            dims["year"].id(year),
            dims["gender"].id(clean(row[col["gender"]])),
            dims["university"].id(university),
            dims["region"].id(clean(row[col["Region"]])),
            dims["level"].id(level),
            dims["generalMajor"].id(clean(row[col["GeneralMajorName"]])),
            dims["narrowMajor"].id(clean(row[col["NarrowMajorName"]])),
            dims["detailedMajor"].id(clean(row[col["DetailedMajorName"]])),
            dims["major"].id(major),
            int(grads),
            int(employed) if isinstance(employed, (int, float)) else 0,
        ])

    missed = [r for r in LEVEL_CORRECTIONS if not r.get("hits")]
    if missed:
        raise SystemExit(
            "level correction matched no rows (a name changed in the source?): "
            + "; ".join(f'{r["university"]} / {r["major"]}' for r in missed))

    report["university"] = {
        "source_rows": len(body),
        "parsed_rows": len(facts),
        "skipped_rows": skipped,
        "total_graduates": sum(f[9] for f in facts),
        "total_employed": sum(f[10] for f in facts),
        "level_corrections": [
            {"university": r["university"], "major": r["major"],
             "from": r["from"], "to": r["to"], "rows": r["hits"]}
            for r in LEVEL_CORRECTIONS],
    }
    return dims, facts


SECTOR_COLUMNS = ["السيارات", "الطيران", "الصناعات البحرية", "الآلات والمعدات",
                  "الكيماويات", "مواد البناء", "المعادن", "التعدين",
                  "الأجهزة الطبية", "الأدوية", "الأغذية", "الطاقة المتجددة",
                  "صناعات تحويلية أخرى"]


def parse_skills(cell):
    """
    Split a skills cell into structured entries.

    Source form is a bulleted run like
        "• الإلمام الرقمي - المستوى 2: متوسط • التخطيط - المستوى 3: متقدم"
    with the bullet, tabs and spacing varying between rows.
    """
    text = clean(cell)
    if not text:
        return []
    out = []
    for chunk in re.split(r"[•·]", text):
        chunk = clean(chunk)
        if not chunk:
            continue
        m = re.search(r"^(.*?)\s*-\s*المستوى\s*(\d+)\s*[:：]?\s*(.*)$", chunk)
        if m:
            out.append({"name": clean(m.group(1)), "level": int(m.group(2)),
                        "levelLabel": clean(m.group(3))})
        else:
            out.append({"name": chunk, "level": None, "levelLabel": None})
    return out


def split_institutions(cell):
    """'جامعة س – المنطقة\\nجامعة ص – المنطقة' -> [{name, region}]."""
    text = clean(cell)
    if not text or text == "N/A":
        return []
    out = []
    for line in re.split(r"\n|(?<=\S)\s{2,}(?=جامعة|كلية|المعهد|معهد)", str(cell)):
        line = clean(line)
        if not line or line == "N/A":
            continue
        parts = re.split(r"\s+[–—-]\s+", line, maxsplit=1)
        out.append({"name": clean(parts[0]),
                    "region": clean(parts[1]) if len(parts) > 1 else None})
    return out


def parse_mining_matches():
    """
    The 'قطاع التعدين' sheets name, per occupation, the education field and the
    universities/colleges whose programmes match it. Sheet 2 carries up to four
    field/institution pairs per occupation; sheet 1 carries one pair plus a
    status column saying how firm the match is.

    Returns {occupation code: {"matches": [...], "status": str|None}}.
    """
    matches = {}

    header, body = sheet_rows(MASTER_XLSX, "قطاع التعدين 2", header_row=1)
    col = {name: i for i, name in enumerate(header) if name}
    for row in body:
        code = clean(row[col["رمز المهنة"]])
        if not code:
            continue
        entry = matches.setdefault(code, {"matches": [], "status": None})
        for n in (1, 2, 3, 4):
            f_key, i_key = f"المجال التعليمي {n}", f"الجامعات/الكليات المطابقة {n}"
            if f_key not in col or i_key not in col:
                continue
            field = clean(row[col[f_key]])
            if not field or field == "N/A":
                continue
            entry["matches"].append({
                "field": field,
                "institutions": split_institutions(row[col[i_key]]),
            })

    # Sheet 1 adds the الحالة flag; some matches are marked estimated.
    header, body = sheet_rows(MASTER_XLSX, "قطاع التعدين 1", header_row=1)
    col = {name: i for i, name in enumerate(header) if name}
    for row in body:
        code = clean(row[col["رمز المهنة"]])
        if not code:
            continue
        entry = matches.setdefault(code, {"matches": [], "status": None})
        status = clean(row[col["الحالة"]]) if "الحالة" in col else None
        if status and entry["status"] is None:
            entry["status"] = status
        field = clean(row[col["المجال التعليمي"]])
        if field and field != "N/A" and not any(m["field"] == field for m in entry["matches"]):
            entry["matches"].append({
                "field": field,
                "institutions": split_institutions(row[col["الجامعات/الكليات المطابقة"]]),
            })
    return matches


def parse_master(report):
    """Occupations, in full: hierarchy, sectors, tasks, skills, NQF level."""
    header, body = sheet_rows(MASTER_XLSX, "قائمة المهن المشمولة Master", header_row=3)
    col = {name: i for i, name in enumerate(header) if name}

    c_ar = col["المهنة"]
    c_en = col["Occupations"]
    c_nqf = col["مستوى المؤهل بحسب الإطار الوطني للمؤهلات"]
    c_isced = col["مستوى المؤهل بحسب ISCED 11 والمطبق في التصنيف السعودي للمهن"]
    c_group = col["المجموعة الرئيسية"]
    fields = [col[f"المجال التعليمي {n}"] for n in (1, 2, 3, 4)]
    tasks = [col[f"المهام الرئيسية للمهنة {n}"] for n in (1, 2, 3, 4, 5)]
    sectors = [(name, col[name]) for name in SECTOR_COLUMNS if name in col]
    mining = parse_mining_matches()

    occupations, unmapped = [], Counter()
    for row in body:
        name_ar = clean(row[c_ar])
        if not name_ar:
            continue
        nqf_label = clean(row[c_nqf])
        level = nqf_level(nqf_label)
        if nqf_label and level is None:
            unmapped[nqf_label] += 1
        code = clean(row[col["رمز المهنة"]])
        match = mining.get(code, {})
        occupations.append({
            "code": code,
            "ar": name_ar,
            "en": clean(row[c_en]),
            "group": clean(row[c_group]),
            "groupCode": clean(row[col["رمز المجموعة الرئيسية"]]),
            "subGroup": clean(row[col["المجموعة الفرعية"]]),
            "minorGroup": clean(row[col["المجموعة الثانوية"]]),
            "unit": clean(row[col["الوحدة"]]),
            "specCode": clean(row[col["رمز التخصص المهني"]]),
            "specAr": clean(row[col["التخصص المهني"]]),
            "specEn": clean(row[col["Occupational Specializations"]]),
            "type": clean(row[col["نوع المهنة/ التخصص المهني"]]),
            "functionalGroup": clean(row[col["المجموعة الوظيفية"]]),
            "sectors": [name for name, i in sectors if clean(row[i])],
            "summary": clean(row[col["ملخص المهنة"]]),
            "tasks": [t for t in (clean(row[i]) for i in tasks) if t],
            "isced": clean(row[c_isced]),
            "nqfLabel": nqf_label,
            "nqfLevel": level,
            "occLevel": clean(row[col["مستوى المهنة / التخصص المهني"]]),
            "fields": [f for f in (clean(row[i]) for i in fields) if f],
            "skills": {
                "basic": parse_skills(row[col["المهارات الأساسية والمستوى الخاص بها"]]),
                "leadership": parse_skills(row[col["المهارات القيادية والمستوى الخاص بها"]]),
                "general": parse_skills(row[col["المهارات العامة والمستوى الخاص بها"]]),
                "technical": parse_skills(row[col["المهارات الفنية والمستوى الخاص بها"]]),
            },
            "programMatches": match.get("matches", []),
            "matchStatus": match.get("status"),
        })

    by_level = Counter(o["nqfLevel"] for o in occupations)
    report["master"] = {
        "source_rows": len(body),
        "occupations": len(occupations),
        "mapped_to_nqf": sum(1 for o in occupations if o["nqfLevel"] is not None),
        "unmapped_labels": dict(unmapped),
        "by_nqf_level": {str(k): v for k, v in sorted(by_level.items(), key=lambda x: (x[0] is None, x[0]))},
        "with_program_matches": sum(1 for o in occupations if o["programMatches"]),
        "match_statuses": dict(Counter(o["matchStatus"] for o in occupations if o["matchStatus"])),
        "with_specialization": sum(1 for o in occupations if o["specAr"]),
    }
    return occupations


def nest_occupations(occupations):
    """
    Describe the 921 occupation rows as the 548 occupations they actually are.

    رمز المهنة is not unique. 129 codes repeat because the occupation has one or
    more التخصص المهني (occupational specializations), and the sheet gives each
    specialization its own row, restating the occupation's identity every time.
    Read flat, those look like duplicate occupations; they are a class/sub-class
    hierarchy. The project owner's own قطاع التعدين sheet confirms the intended
    grain: one row per (occupation, specialization), never per occupation alone.

    Within a repeated code the identity columns agree (the المهنة name matches in
    128 of the 129 groups) while the descriptive columns differ: summary and
    tasks in all 129 groups, skills in 128, sectors in 68, education fields in
    58. So the parent owns the classification and each child owns its own
    description.

    This emits indexes into the flat `occupations` list rather than copies, so
    the tree costs a few KB and stays the single source of truth: nothing is
    duplicated and nothing can drift.

    The row carrying no التخصص المهني is the occupation's own base description.
    Where a group has none, `baseFromChild` marks that the parent is showing its
    first specialization's text, so the UI can say so rather than implying the
    sheet described the occupation itself.
    """
    groups = OrderedDict()
    for i, occ in enumerate(occupations):
        groups.setdefault(occ["code"], []).append(i)

    tree = []
    for code, idxs in groups.items():
        base = next((i for i in idxs if not occupations[i]["specAr"]), None)
        source = occupations[base if base is not None else idxs[0]]
        children = [i for i in idxs if occupations[i]["specAr"]]
        tree.append({
            "code": code,
            # Identity lives on occupations[base]; repeating it here would be
            # the same duplication this function exists to remove.
            "base": base if base is not None else idxs[0],
            "baseFromChild": base is None,
            "children": children,
            # The union over parent and children: what the occupation covers as
            # a whole, so a sector or field filter finds it via any child.
            "allSectors": sorted({s for i in idxs for s in occupations[i]["sectors"]}),
            "allFields": sorted({f for i in idxs for f in occupations[i]["fields"]}),
        })
    return tree


def intern_occupations(occupations):
    """
    Replace repeated strings inside the occupation records with indexes into
    shared lexicons.

    Skill entries dominate the payload (2.1 MB of 3.9 MB) because the same
    skill names recur across hundreds of occupations, and the 469 programme
    institution lists have only 17 distinct values between them. Interning
    both cuts the file by roughly 4x with no loss: the dashboard resolves the
    indexes back to the identical strings at load.

    Returns the lexicon; mutates the occupation records in place.
    """
    skill_names, skill_levels, sectors, fields, inst_lists = {}, {}, {}, {}, {}

    def key(store, value):
        if value is None:
            return None
        if value not in store:
            store[value] = len(store)
        return store[value]

    def pack_skills(entries):
        return [[key(skill_names, s["name"]), s["level"],
                 key(skill_levels, s["levelLabel"])] for s in entries]

    for occ in occupations:
        occ["sectors"] = [key(sectors, s) for s in occ["sectors"]]
        occ["fields"] = [key(fields, f) for f in occ["fields"]]
        occ["skills"] = {k: pack_skills(v) for k, v in occ["skills"].items()}
        packed = []
        for m in occ["programMatches"]:
            blob = json.dumps(m["institutions"], ensure_ascii=False, sort_keys=True)
            packed.append([key(fields, m["field"]), key(inst_lists, blob)])
        occ["programMatches"] = packed

    def order(store):
        return [k for k, _ in sorted(store.items(), key=lambda kv: kv[1])]

    return {
        "skillNames": order(skill_names),
        "skillLevels": order(skill_levels),
        "sectors": order(sectors),
        "fields": order(fields),
        "instLists": [json.loads(b) for b in order(inst_lists)],
    }


def nqf_for_labels(labels):
    """Map a dimension's labels to NQF levels, flagging what will not map."""
    out, unresolved = [], []
    for label in labels:
        level = nqf_level(label)
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

    # Occupation -> graduate data bridge. An occupation's "المجال التعليمي" is
    # matched against the university sheet's DetailedMajorName. Only exact
    # string matches are linked; near-misses are left unlinked rather than
    # fuzzy-matched into a number that would look authoritative and not be.
    detailed_majors = set(uni_dims["detailedMajor"].labels())
    all_fields = set()
    for occ in occupations:
        all_fields.update(occ["fields"])
        for m in occ["programMatches"]:
            all_fields.add(m["field"])
    field_links = {f: f for f in sorted(all_fields) if f in detailed_majors}
    report["links"] = {
        "education_fields": len(all_fields),
        "linked_to_university_major": len(field_links),
        "vocational_major_overlap": len(
            all_fields & set(voc_dims["major"].labels())),
    }

    # Interning must run after field_links, which needs the plain strings.
    lexicon = intern_occupations(occupations)
    # The hierarchy indexes into the flat list, so it must be built from the
    # same list the payload ships. Additive: the flat list stays authoritative.
    occupation_tree = nest_occupations(occupations)
    report["tree"] = {
        "occupations": len(occupation_tree),
        "with_specializations": sum(1 for t in occupation_tree if t["children"]),
        "max_specializations": max((len(t["children"]) for t in occupation_tree), default=0),
        "base_from_child": sum(1 for t in occupation_tree if t["baseFromChild"]),
    }

    payload = {
        "lexicon": lexicon,
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
            "ownerAssigned": OWNER_ASSIGNED_NQF,
            "corrections": [
                {"university": r["university"], "major": r["major"],
                 "from": r["from"], "to": r["to"]}
                for r in LEVEL_CORRECTIONS],
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
        "occupationTree": occupation_tree,
        "fieldLinks": field_links,
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
    print(f"  with specialization  {m['with_specialization']:,}")
    print(f"  with programme match {m['with_program_matches']:,}   statuses={m['match_statuses']}")
    if m["unmapped_labels"]:
        print(f"  UNMAPPED labels  {m['unmapped_labels']}")

    tr = report["tree"]
    print(f"\noccupation hierarchy:")
    print(f"  rows -> occupations       {len(occupations):,} -> {tr['occupations']:,}")
    print(f"  with specializations      {tr['with_specializations']:,}")
    print(f"  largest occupation        {tr['max_specializations']} specializations")
    print(f"  base text from a child    {tr['base_from_child']}")

    lk = report["links"]
    print(f"\noccupation -> graduate bridge:")
    print(f"  education fields          {lk['education_fields']}")
    print(f"  linked to a university major {lk['linked_to_university_major']}")
    print(f"  overlap with vocational majors {lk['vocational_major_overlap']}")

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
