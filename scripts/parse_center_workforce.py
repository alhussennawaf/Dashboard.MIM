#!/usr/bin/env python3
"""
Parse the National Information Center workforce extract into a compact static
payload that index.html reads directly.

    python3.13 scripts/parse_center_workforce.py <source.xlsx>

Writes:
    data/center-workforce.js    window.MIM_CENTER = {...}
    data/center-workforce.json  same payload, for inspection/diffing

Design notes
------------
* The source is one flat fact table: 627,828 rows, one per combination of
  establishment x place x activity x band x person-attributes x occupation,
  with عدد العمالة as the only measure. 6,120 of those rows carry no measure
  at all (an establishment with nothing recorded against it); they are skipped
  for worker counts but still counted as establishments on file.
* Nothing is invented. Every number emitted is a sum of source cells.
* (القسم, نوع المهنة, مستوى المهارة) was verified to be a pure function of
  رمز المهنة across all 1,701 codes, so occupations collapse to a lexicon and
  the fact rows carry a single class index instead of three labels.
* القطاع الاقتصادي holds several codes concatenated into one cell when an
  establishment spans more than one. The fact rows keep the combination as a
  single index and `sectorAtoms` maps each combination to its atoms, so a fact
  row is never duplicated: totals over any dimension stay exact. Only the
  sector chart walks the atoms, and there a worker in a two-sector
  establishment is counted under both, which is why `sectorDouble` carries the
  sum of the parts beside the true headcount for the page to say so out loud.
* Establishment counts are distinct counts, so they cannot be summed. They are
  precomputed per dimension value and per (value x nationality x gender), an
  establishment counting where it employs at least one such worker.
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl is required:  python3.13 -m pip install openpyxl")

ROOT = Path(__file__).resolve().parent.parent
OUT_JS = ROOT / "data" / "center-workforce.js"
OUT_JSON = ROOT / "data" / "center-workforce.json"

PERIOD = "أغسطس 2026"
SOURCE = "بيانات المركز الوطني للمعلومات"

# A cell may read "12 - صناعة المعادن 16 - مواد البناء". Split before any run of
# digits that is followed by " - " and is not itself part of a longer number.
SPLIT = re.compile(r"(?=(?<!\d)\d{1,4}\s*-\s)")
UNCLASSIFIED = "(غير مصنف)"


def norm(v):
    return " ".join(str(v).split()) if v is not None else "NULL"


def atoms(s):
    if not s or s == "NULL":
        return [UNCLASSIFIED]
    parts = [p.strip() for p in SPLIT.split(s) if p.strip()]
    return parts or [s]


class Dim:
    """A dimension lexicon: label -> stable index, in first-seen order."""

    def __init__(self):
        self.ix = {}
        self.labels = []

    def __call__(self, label):
        i = self.ix.get(label)
        if i is None:
            i = len(self.labels)
            self.ix[label] = i
            self.labels.append(label)
        return i


def main(src):
    wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
    ws = wb["Sheet1"]
    it = ws.iter_rows(values_only=True)
    hdr = [norm(c) for c in next(it)]
    hdr = [h for h in hdr if h and h != "NULL"]
    I = {h: i for i, h in enumerate(hdr)}

    need = ["رقم المنشأة", "المنطقة", "المدينة", "القطاع الاقتصادي",
            "الحجم من منشآت", "حالة المنشأة", "النطاق", "الفئة العمرية",
            "فئة الرواتب", "الجنسية", "الجنس", "رمز المهنة", "المهنة",
            "القسم", "نوع المهنة/ التخصص المهني", "مستوى المهارة", "عدد العمالة"]
    missing = [h for h in need if h not in I]
    if missing:
        sys.exit("source is missing expected columns: " + ", ".join(missing))

    D = {k: Dim() for k in ("region", "sector", "size", "nitaq", "status",
                            "salary", "nat", "sex", "major", "type", "skill",
                            "city", "age")}
    combo = Dim()                     # raw القطاع الاقتصادي cell, as written
    combo_atoms = {}                  # combination index -> [sector atom index]
    classes = {}                      # (major,type,skill) -> class index
    class_list = []
    facts = defaultdict(int)          # (reg,sec,size,nit,sta,sal,nat,sex,cls) -> workers
    occ_cells = defaultdict(int)      # (occ,nat,sex) -> workers
    city_cells = defaultdict(int)
    age_cells = defaultdict(int)
    occ_ix, occ_code, occ_name, occ_cls = {}, [], [], []

    est_all = set()
    est_dim = {k: defaultdict(set) for k in ("region", "sector", "size", "nitaq", "status", "city")}
    est_dim_ns = {k: defaultdict(set) for k in ("region", "sector", "size", "nitaq", "status", "city")}

    rows = measured = skipped = 0
    total = 0
    sector_parts = 0

    for r in it:
        rows += 1
        est = r[I["رقم المنشأة"]]
        est_all.add(est)
        raw = r[I["عدد العمالة"]]
        try:
            w = int(raw)
        except (TypeError, ValueError):
            skipped += 1
            continue
        measured += 1
        total += w

        reg = D["region"](norm(r[I["المنطقة"]]))
        city = D["city"](norm(r[I["المدينة"]]))
        size = D["size"](norm(r[I["الحجم من منشآت"]]))
        nit = D["nitaq"](norm(r[I["النطاق"]]))
        sta = D["status"](norm(r[I["حالة المنشأة"]]))
        sal = D["salary"](norm(r[I["فئة الرواتب"]]))
        nat = D["nat"](norm(r[I["الجنسية"]]))
        sex = D["sex"](norm(r[I["الجنس"]]))
        age = D["age"](norm(r[I["الفئة العمرية"]]))

        mj = D["major"](norm(r[I["القسم"]]))
        ty = D["type"](norm(r[I["نوع المهنة/ التخصص المهني"]]))
        sk = D["skill"](norm(r[I["مستوى المهارة"]]))
        key = (mj, ty, sk)
        cls = classes.get(key)
        if cls is None:
            cls = len(class_list)
            classes[key] = cls
            class_list.append([mj, ty, sk])

        code = norm(r[I["رمز المهنة"]])
        oi = occ_ix.get(code)
        if oi is None:
            oi = len(occ_code)
            occ_ix[code] = oi
            occ_code.append(code)
            occ_name.append(norm(r[I["المهنة"]]))
            occ_cls.append(cls)

        occ_cells[(oi, nat, sex)] += w
        city_cells[(city, nat, sex)] += w
        age_cells[(age, nat, sex)] += w

        ns = nat * 2 + sex
        for k, v in (("region", reg), ("size", size), ("nitaq", nit),
                     ("status", sta), ("city", city)):
            est_dim[k][v].add(est)
            est_dim_ns[k][(v, ns)].add(est)

        raw_sec = norm(r[I["القطاع الاقتصادي"]])
        ci = combo(raw_sec)
        parts = combo_atoms.get(ci)
        if parts is None:
            parts = [D["sector"](a) for a in atoms(raw_sec)]
            combo_atoms[ci] = parts
        facts[(reg, ci, size, nit, sta, sal, nat, sex, cls)] += w
        for si in parts:
            sector_parts += w
            est_dim["sector"][si].add(est)
            est_dim_ns["sector"][(si, ns)].add(est)

    wb.close()

    def est_block(k):
        n = len(D[k].labels)
        return {
            "all": [len(est_dim[k].get(i, ())) for i in range(n)],
            "byNatSex": [[len(est_dim_ns[k].get((i, ns), ())) for ns in range(4)]
                         for i in range(n)],
        }

    payload = {
        "meta": {
            "period": PERIOD,
            "source": SOURCE,
            "file": Path(src).name,
            "rows": rows,
            "measuredRows": measured,
            "rowsWithoutMeasure": skipped,
            "totalWorkers": total,
            "establishments": len(est_all),
            "establishmentsWithWorkers": len(set().union(*est_dim["region"].values())),
        },
        "dims": {k: v.labels for k, v in D.items()},
        "classes": class_list,
        "sectorAtoms": [combo_atoms[i] for i in range(len(combo.labels))],
        "facts": [list(k) + [v] for k, v in sorted(facts.items())],
        "est": {k: est_block(k) for k in est_dim},
        "occ": {
            "code": occ_code,
            "name": occ_name,
            "cls": occ_cls,
            "cells": [list(k) + [v] for k, v in sorted(occ_cells.items())],
        },
        "cityCells": [list(k) + [v] for k, v in sorted(city_cells.items())],
        "ageCells": [list(k) + [v] for k, v in sorted(age_cells.items())],
        "sectorDouble": {"sumOfParts": sector_parts, "total": total},
    }

    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    OUT_JS.write_text("window.MIM_CENTER = " + json.dumps(payload, ensure_ascii=False,
                                                          separators=(",", ":")) + ";\n",
                      encoding="utf-8")

    m = payload["meta"]
    print(f"rows {m['rows']:,}  measured {m['measuredRows']:,}  "
          f"no-measure {m['rowsWithoutMeasure']:,}")
    print(f"workers {m['totalWorkers']:,}   establishments {m['establishments']:,} "
          f"(with workers {m['establishmentsWithWorkers']:,})")
    print(f"fact rows {len(payload['facts']):,}   classes {len(class_list)}   "
          f"occupations {len(occ_code):,}   sector combinations {len(combo.labels):,}")
    for k, v in payload["dims"].items():
        print(f"   {k:8s} {len(v):>5,}")
    sd = payload["sectorDouble"]
    print(f"sector parts {sd['sumOfParts']:,} vs total {sd['total']:,} "
          f"(+{(sd['sumOfParts']/sd['total']-1)*100:.1f}%)")
    print(f"wrote {OUT_JS}  {OUT_JS.stat().st_size/1048576:.2f} MB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
