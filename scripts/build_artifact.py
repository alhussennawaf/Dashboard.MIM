#!/usr/bin/env python3
"""
Repackage the standalone dashboard as an Artifact-shaped page.

    python3 scripts/build_artifact.py   ->   dashboard.artifact.html

The Artifact host wraps the file it is given in its own
<!doctype html><head>…</head><body> skeleton, so the file must carry page
content only. This strips our own document wrapper and the meta and favicon
tags the skeleton already provides, keeps the <title>, <style> and <script>
blocks, and re-applies the RTL direction that used to live on <html>.

Nothing about the design changes: the brand palette, layout and copy are the
reviewed dashboard exactly as it ships in dashboard.html.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "dashboard.standalone.html"
OUT = ROOT / "dashboard.artifact.html"

ARTIFACT_TITLE = "خريجو الصناعة والتعدين"

# The direction lived on <html>, which we no longer emit. The specialization
# window is appended to document.body, outside any wrapper element, so the
# direction has to sit on the document element rather than on a wrapper div.
RTL_BOOTSTRAP = """<script>
/* Direction and language belong on the document element: the specialization
   window mounts on document.body, outside any wrapper this file could add. */
document.documentElement.setAttribute("dir", "rtl");
document.documentElement.setAttribute("lang", "ar");
</script>
"""


def main():
    if not SRC.exists():
        sys.exit(f"missing {SRC} — run scripts/build_standalone.py first")
    html = SRC.read_text(encoding="utf-8")

    # Split on positions, not a non-greedy regex: the inlined ECharts source
    # contains a literal "</body>", which truncated an earlier version of this
    # build to a fifth of its size while still producing valid-looking HTML.
    try:
        head_open = html.index("<head>") + len("<head>")
        body_open = html.index("<body>", head_open) + len("<body>")
        head_close = html.rindex("</head>", head_open, body_open)
        body_close = html.rindex("</body>")
    except ValueError:
        sys.exit("could not find <head> / <body> in the standalone build")

    # The skeleton supplies charset and viewport; the favicon comes from the
    # publish call's emoji parameter, so the <link rel="icon"> would be dead.
    kept = html[head_open:head_close]
    kept = re.sub(r'\s*<meta[^>]*>', "", kept)
    kept = re.sub(r'\s*<link rel="icon"[^>]*>', "", kept)

    # The file's own <title> carries an English gloss after a pipe, which reads
    # as filler in a gallery listing. The artifact gets the name alone.
    kept = re.sub(r"<title>.*?</title>", "<title>" + ARTIFACT_TITLE + "</title>",
                  kept, count=1, flags=re.S)

    out = RTL_BOOTSTRAP + kept.strip() + "\n" + html[body_open:body_close].strip() + "\n"

    # Check for a surviving wrapper outside script and style bodies only. The
    # inlined ECharts source contains the literal "</body>" as JS string data,
    # which is harmless: inside a <script>, only "</script>" ends the block.
    markup = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", "", out, flags=re.S | re.I)
    for tag in ("<!doctype", "<html", "</html>", "<head>", "</head>", "<body>", "</body>"):
        if tag in markup.lower():
            sys.exit(f"document wrapper survived stripping: {tag}")

    OUT.write_text(out, encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", out, re.S)
    print(f"title: {title.group(1).strip() if title else '(none)'}")
    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
