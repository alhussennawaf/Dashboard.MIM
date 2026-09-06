#!/usr/bin/env python3
"""
Inline every local dependency of dashboard.html into one portable file.

    python3 scripts/build_standalone.py   ->   dashboard.standalone.html

dashboard.html is the source of truth and works fine on its own as long as
the ./assets and ./data folders travel with it. This build is for the case
where the file has to travel alone (email, USB stick, a shared drive that
flattens folders).
"""

import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "dashboard.html"
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

    n_img = 0
    for rel, mime in [("assets/mim-logo-primary.svg", "image/svg+xml"),
                      ("assets/mim-emblem.svg", "image/svg+xml")]:
        path = ROOT / rel
        if path.exists() and rel in html:
            html = html.replace(rel, data_uri(path, mime))
            n_img += 1

    if "src=\"assets/" in html or "href=\"assets/" in html or "src=\"data/" in html:
        leftover = re.findall(r'(?:src|href)="((?:assets|data)/[^"]+)"', html)
        sys.exit(f"still referencing local files: {sorted(set(leftover))}")

    OUT.write_text(html, encoding="utf-8")
    print(f"inlined {n_js} script(s), {n_css} stylesheet(s), {n_img} image(s)")
    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
