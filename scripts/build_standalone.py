#!/usr/bin/env python3
"""
Inline every local dependency of index.html into one portable file.

    python3 scripts/build_standalone.py   ->   dashboard.standalone.html

index.html is the source of truth and works fine on its own as long as
the ./assets and ./data folders travel with it. This build is for the case
where the file has to travel alone (email, USB stick, a shared drive that
flattens folders).
"""

import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "index.html"
OUT = ROOT / "dashboard.standalone.html"


def data_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def main():
    if not SRC.exists():
        sys.exit(f"missing {SRC}")
    html = SRC.read_text(encoding="utf-8")

    def inline_script(match):
        src = match.group(1)
        path = ROOT / src
        if not path.exists():
            sys.exit(f"referenced file not found: {src}")
        body = path.read_text(encoding="utf-8")
        # A literal </script> inside JS would close the tag early.
        body = body.replace("</script>", "<\\/script>")
        return f"<script>\n/* inlined from {src} */\n{body}\n</script>"

    def inline_style(match):
        src = match.group(1)
        path = ROOT / src
        if not path.exists():
            sys.exit(f"referenced file not found: {src}")
        return f"<style>\n/* inlined from {src} */\n{path.read_text(encoding='utf-8')}\n</style>"

    html, n_js = re.subn(r'<script src="([^"]+)"></script>', inline_script, html)
    html, n_css = re.subn(r'<link rel="stylesheet" href="([^"]+)">', inline_style, html)

    # The standalone file travels alone, so the canonical and og:* URLs it
    # carries would point at a page it is not. They are dropped rather than
    # left pointing somewhere else.
    html = re.sub(r'\s*<link rel="canonical"[^>]*>', "", html)
    html = re.sub(r'\s*<meta (?:property="og:|name="twitter:)[^>]*>', "", html)

    # Same reasoning for the deploy-only chrome: /privacy.html and /terms.html
    # do not exist beside a file on a USB stick, and the notice bar's only job
    # is to link to one of them. A dead link is worse than no link.
    html, n_foot = re.subn(r'\s*<nav class="footlinks".*?</nav>', "", html, flags=re.S)
    # The notice has no nested <div>, so its own closing tag is the first one
    # after it. An earlier version matched "</div>\s*</div>" and swallowed a
    # quarter of the file before finding a pair — hence the size check below.
    html, n_note = re.subn(r'\s*<div class="notice" id="privacyNotice".*?</div>',
                           "", html, flags=re.S)
    if (n_foot, n_note) != (1, 1):
        sys.exit(f"expected one footlinks nav and one notice block, "
                 f"found {n_foot} and {n_note}")

    n_img = 0
    for rel, mime in [("assets/mim-logo-primary.svg", "image/svg+xml"),
                      ("assets/mim-emblem.svg", "image/svg+xml"),
                      ("assets/favicon.ico", "image/x-icon"),
                      ("assets/icon-180.png", "image/png")]:
        path = ROOT / rel
        if path.exists() and rel in html:
            html = html.replace(rel, data_uri(path, mime))
            n_img += 1

    if "src=\"assets/" in html or "href=\"assets/" in html or "src=\"data/" in html:
        leftover = re.findall(r'(?:src|href)="((?:assets|data)/[^"]+)"', html)
        sys.exit(f"still referencing local files: {sorted(set(leftover))}")

    # Inlining only ever grows the file. If the result is smaller than the
    # sources it was built from, something was stripped that should not have
    # been — which is exactly how a regex that over-matched went unnoticed.
    floor = SRC.stat().st_size + sum(
        (ROOT / r).stat().st_size for r in
        ("assets/echarts.min.js", "assets/reactbits.js", "data/dashboard-data.js"))
    if len(html.encode("utf-8")) < floor * 0.98:
        sys.exit(f"output is {len(html.encode('utf-8')):,} bytes but its sources "
                 f"alone are {floor:,} — stripping removed too much")

    OUT.write_text(html, encoding="utf-8")
    print(f"inlined {n_js} script(s), {n_css} stylesheet(s), {n_img} image(s)")
    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
