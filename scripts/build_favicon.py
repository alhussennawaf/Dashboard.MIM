#!/usr/bin/env python3
"""
Pack the rendered icon frames into a multi-size favicon.ico.

    node scripts/build_images.js     # renders assets/icon-{16,32,48,180,512}.png
    python3 scripts/build_favicon.py # packs 16/32/48 into assets/favicon.ico

Two steps because the two halves need different tools: the frames come from
Chromium, which renders the emblem's gradients and clip paths correctly, and
the container is written by Pillow, which is the thing here that can write ICO.

A single .ico carrying 16, 32 and 48 is what Windows, older Edge and Safari
still reach for; the SVG and the 180px PNG in the page cover everything else.
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
FRAMES = [16, 32, 48]


def main():
    missing = [s for s in FRAMES if not (ASSETS / f"icon-{s}.png").exists()]
    if missing:
        sys.exit("missing frame(s): " + ", ".join(f"icon-{s}.png" for s in missing) +
                 " — run `node scripts/build_images.js` first")

    # Save from the LARGEST frame. Pillow's ICO writer derives the requested
    # sizes from the image it is given, so starting at 16 silently produced a
    # single-frame icon — it cannot upscale. append_images then supplies the
    # smaller frames as their own Chromium renders rather than downsamples.
    frames = {s: Image.open(ASSETS / f"icon-{s}.png").convert("RGBA") for s in FRAMES}
    largest = max(FRAMES)
    out = ASSETS / "favicon.ico"
    frames[largest].save(
        out, format="ICO", sizes=[(s, s) for s in FRAMES],
        append_images=[frames[s] for s in FRAMES if s != largest])
    print(f"wrote {out.relative_to(ROOT)}  ({out.stat().st_size:,} bytes, "
          f"sizes {'/'.join(str(s) for s in FRAMES)})")


if __name__ == "__main__":
    main()
