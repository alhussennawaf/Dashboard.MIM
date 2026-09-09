#!/usr/bin/env python3
"""
Assemble the directory Cloudflare serves.

    python3 scripts/build_site.py   ->   site/

The repository holds things that must never reach a public URL: the ministry's
source workbooks, the brand guidelines PDF, the framework PDF, the parsers. So
the deploy target is an allow-list — this script copies the handful of files the
browser actually requests and nothing else — rather than the repository root
with an ignore-list, where a file added later would be published by default.

The result is committed, because the Cloudflare build runs `wrangler deploy`
directly and does not run this script. Re-run it after any change to
index.html, assets/ or the parsed data, and commit what changes.
"""

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"

# Every file the page requests at runtime, and only those. Paths are relative
# to the repository root and keep their layout inside site/.
PUBLISHED = [
    "index.html",
    "assets/brand.css",
    "assets/echarts.min.js",
    "assets/mim-logo-primary.svg",
    "assets/mim-emblem.svg",
    "data/dashboard-data.js",
]

# Nothing matching these may appear under site/, whatever the list above says.
FORBIDDEN_SUFFIXES = {".xlsx", ".xls", ".pdf", ".py", ".json", ".md"}


def main():
    missing = [p for p in PUBLISHED if not (ROOT / p).exists()]
    if missing:
        sys.exit("missing source file(s): " + ", ".join(missing))

    if SITE.exists():
        shutil.rmtree(SITE)
    for rel in PUBLISHED:
        dest = SITE / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / rel, dest)

    # The page must be reachable at "/" — that is the whole point of the rename.
    if not (SITE / "index.html").exists():
        sys.exit("site/index.html is missing")

    written = sorted(p for p in SITE.rglob("*") if p.is_file())
    leaked = [p for p in written if p.suffix.lower() in FORBIDDEN_SUFFIXES]
    if leaked:
        sys.exit("refusing to publish: " + ", ".join(
            str(p.relative_to(ROOT)) for p in leaked))

    # An unreferenced file in site/ means the copy list drifted from the page.
    unexpected = {str(p.relative_to(SITE)) for p in written} - set(PUBLISHED)
    if unexpected:
        sys.exit("unexpected file(s) in site/: " + ", ".join(sorted(unexpected)))

    total = sum(p.stat().st_size for p in written)
    print(f"site/  {len(written)} files, {total:,} bytes")
    for p in written:
        print(f"  {p.relative_to(SITE)}  ({p.stat().st_size:,})")


if __name__ == "__main__":
    main()
