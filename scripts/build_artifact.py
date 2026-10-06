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
reviewed dashboard exactly as it ships in index.html.

One behaviour is added, and only here: the exports. The dashboard hands a file
over the way the web does — an <a download> pointing at a blob — and the
Artifact viewer never grants a framed page that permission, so in a published
artifact every export button would silently do nothing. The bridge below
routes those same clicks through the viewer's own save, which asks the person
and then writes the file. It is appended to this build alone; index.html stays
a plain page that works from a web server and from a file:// copy.
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


# The viewer exposes `window.claude`; a page opened any other way does not
# have it, and there the browser's own download is already correct. The
# dashboard's downloadCsv() and downloadPng() both end in a click on an
# anchor carrying a `download` attribute and a blob: href, so one patch on
# HTMLAnchorElement covers every export without the dashboard knowing it is
# inside an artifact.
DOWNLOAD_BRIDGE = """<script>
(function () {
  if (!window.claude || typeof window.claude.use !== "function") return;
  var ready = window.claude.use("downloads").then(function (d) { return d; },
                                                  function () { return null; });
  var nativeClick = HTMLAnchorElement.prototype.click;

  function say(msg) {
    var el = document.createElement("div");
    el.setAttribute("role", "status");
    el.style.cssText = "position:fixed;inset-inline-start:50%;bottom:22px;" +
      "transform:translateX(-50%);z-index:9999;background:#1A1A1A;color:#fff;" +
      "padding:11px 18px;border-radius:3px;font-size:13px;max-width:86vw;" +
      "box-shadow:0 10px 30px rgba(0,0,0,.3)";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 4200);
  }

  HTMLAnchorElement.prototype.click = function () {
    var a = this;
    var filename = a.getAttribute("download");
    var href = a.getAttribute("href") || "";
    if (!filename || (href.indexOf("blob:") !== 0 && href.indexOf("data:") !== 0)) {
      return nativeClick.call(a);
    }
    /* The page revokes its blob URL a second after the click, so it is read
       now and the bytes are what travel. */
    fetch(href).then(function (r) { return r.blob(); }).then(function (blob) {
      return ready.then(function (dl) {
        if (!dl) { say("حفظ الملفات غير متاح في هذا العرض."); return null; }
        return dl.save({ filename: filename, data: blob });
      });
    }).then(null, function (e) {
      /* Declining is an answer, not a failure, and needs no notice. */
      if (e && e.code === "declined") return;
      say("تعذّر حفظ الملف: " + ((e && (e.message || e.code)) || "خطأ غير معروف"));
    });
  };
})();
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
    kept = re.sub(r'\s*<link rel="(?:icon|apple-touch-icon|canonical)"[^>]*>', "", kept)

    # The file's own <title> carries an English gloss after a pipe, which reads
    # as filler in a gallery listing. The artifact gets the name alone.
    kept = re.sub(r"<title>.*?</title>", "<title>" + ARTIFACT_TITLE + "</title>",
                  kept, count=1, flags=re.S)

    out = (RTL_BOOTSTRAP + kept.strip() + "\n" +
           html[body_open:body_close].strip() + "\n" + DOWNLOAD_BRIDGE)

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
