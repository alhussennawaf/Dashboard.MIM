#!/usr/bin/env python3
"""
Independent spot-check of data/dashboard-data.json against the source
workbooks.

This deliberately does NOT use openpyxl. It unzips the .xlsx and walks the
raw sheet XML itself, so a bug in the parsing library cannot produce a
matching wrong answer on both sides.

    python3 scripts/verify_totals.py
"""

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def read_sheet(xlsx_path, sheet_name):
    """Return the sheet as a list of row-lists of strings, from raw XML."""
    with zipfile.ZipFile(xlsx_path) as z:
        workbook = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        target = {r.get("Id"): r.get("Target") for r in rels}

        sheet_path = None
        for sheet in workbook.iter(f"{NS}sheet"):
            if sheet.get("name") == sheet_name:
                rid = sheet.get(
                    "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
                sheet_path = "xl/" + target[rid].lstrip("/").replace("xl/", "", 1)
                break
        if sheet_path is None:
            sys.exit(f"sheet not found: {sheet_name}")

        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            sst = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in sst.iter(f"{NS}si"):
                shared.append("".join(t.text or "" for t in si.iter(f"{NS}t")))

        sheet_xml = ET.fromstring(z.read(sheet_path))

    rows = []
    for row in sheet_xml.iter(f"{NS}row"):
        cells = {}
        for c in row.iter(f"{NS}c"):
            ref = c.get("r")
            col = re.match(r"([A-Z]+)", ref).group(1)
            ctype = c.get("t")
            if ctype == "inlineStr":
                value = "".join(t.text or "" for t in c.iter(f"{NS}t"))
            else:
                v = c.find(f"{NS}v")
                value = v.text if v is not None else None
                if ctype == "s" and value is not None:
                    value = shared[int(value)]
            cells[col] = value
        rows.append(cells)
    return rows


def col_index(letters):
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def check(label, expected, actual):
    ok = expected == actual
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {label}")
    print(f"         source={expected:,}   dashboard={actual:,}")
    return ok


def main():
    payload = json.loads((DATA / "dashboard-data.json").read_text(encoding="utf-8"))
    results = []

    # ---------------- vocational ----------------------------------------
    print("\nVOCATIONAL  (خريجي التعليم المهني 2020-2025.xlsx, Sheet1)")
    rows = read_sheet(DATA / "خريجي التعليم المهني 2020-2025.xlsx", "Sheet1")
    body = rows[1:]
    # column A graduate_year, F region, I Total_CurrentJob, J Total_graduates
    src_total = sum(int(r["J"]) for r in body if r.get("J"))
    src_employed = sum(int(r["I"]) for r in body if r.get("I"))
    src_2020 = sum(int(r["J"]) for r in body if r.get("J") and r.get("A") == "2020")
    src_riyadh = sum(int(r["J"]) for r in body
                     if r.get("J") and r.get("F") == "منطقة الرياض")

    voc = payload["vocational"]
    ci = {name: i for i, name in enumerate(voc["cols"])}
    dash_total = sum(r[ci["graduates"]] for r in voc["rows"])
    dash_employed = sum(r[ci["employed"]] for r in voc["rows"])
    y2020 = voc["dims"]["year"].index("2020")
    dash_2020 = sum(r[ci["graduates"]] for r in voc["rows"] if r[ci["year"]] == y2020)
    riyadh = voc["dims"]["region"].index("منطقة الرياض")
    dash_riyadh = sum(r[ci["graduates"]] for r in voc["rows"] if r[ci["region"]] == riyadh)

    results.append(check("total graduates, all years", src_total, dash_total))
    results.append(check("total employed, all years", src_employed, dash_employed))
    results.append(check("graduates in 2020", src_2020, dash_2020))
    results.append(check("graduates in منطقة الرياض", src_riyadh, dash_riyadh))

    # ---------------- university ----------------------------------------
    print("\nUNIVERSITY  (خريجي الجامعات...xlsx, sheet النتائج)")
    rows = read_sheet(DATA / "خريجي الجامعات للتخصصات بالمجال 0705 2020-2025.xlsx", "النتائج")
    body = rows[1:]
    # column A graduation_year, E EducationLevel, M Total_Graduates, N Total_Employees
    src_total = sum(int(r["M"]) for r in body if r.get("M"))
    src_employed = sum(int(r["N"]) for r in body if r.get("N"))
    src_2025 = sum(int(r["M"]) for r in body if r.get("M") and r.get("A") == "2025")
    src_bach = sum(int(r["M"]) for r in body if r.get("M") and r.get("E") == "بكالوريوس")

    uni = payload["university"]
    ci = {name: i for i, name in enumerate(uni["cols"])}
    dash_total = sum(r[ci["graduates"]] for r in uni["rows"])
    dash_employed = sum(r[ci["employed"]] for r in uni["rows"])
    y2025 = uni["dims"]["year"].index("2025")
    dash_2025 = sum(r[ci["graduates"]] for r in uni["rows"] if r[ci["year"]] == y2025)
    bach = uni["dims"]["level"].index("بكالوريوس")
    dash_bach = sum(r[ci["graduates"]] for r in uni["rows"] if r[ci["level"]] == bach)

    results.append(check("total graduates, all years", src_total, dash_total))
    results.append(check("total employed, all years", src_employed, dash_employed))
    results.append(check("graduates in 2025", src_2025, dash_2025))
    results.append(check("graduates at بكالوريوس level", src_bach, dash_bach))

    # ---- cross-check against a figure the workbook computed itself ------
    print("\nCROSS-CHECK against the source workbook's own computed value")
    analysis = read_sheet(DATA / "خريجي الجامعات للتخصصات بالمجال 0705 2020-2025.xlsx",
                          "تحليل هندسة المواد")
    stated = None
    for r in analysis:
        if r.get("A") and "نسبة التوظيف لكامل القطاع" in str(r["A"]):
            stated = float(r["B"])
            break
    computed = dash_employed / dash_total
    ok = stated is not None and abs(stated - computed) < 1e-12
    print(f"  [{'PASS' if ok else 'FAIL'}] sector-wide employment rate")
    print(f"         workbook states  {stated!r}")
    print(f"         dashboard yields {computed!r}")
    results.append(ok)

    # ---------------- occupations ---------------------------------------
    print("\nMASTER OCCUPATIONS  (260218 Final Master Sheet...xlsx)")
    rows = read_sheet(DATA / "260218 Final Master Sheet with Occupations in EN.xlsx",
                      "قائمة المهن المشمولة Master")
    src_count = sum(1 for r in rows[3:] if r.get("J"))
    dash_count = len(payload["occupations"])
    results.append(check("occupation rows", src_count, dash_count))

    print("\n" + "=" * 60)
    print(f"{sum(results)}/{len(results)} checks passed")
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
