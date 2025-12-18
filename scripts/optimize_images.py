#!/usr/bin/env python3
"""
Resize and convert heavy images to WebP/JPEG variants for better Core Web Vitals.

Usage:
  python scripts/optimize_images.py

Outputs:
  - Hero images: 800/1280/1920 px widths
  - Content images: 400/640/800 px widths
  - Both WebP (quality=80) and JPEG fallbacks (quality=80, progressive)
  - Files are written alongside the originals, e.g. hero-electronics-macro-1280.webp
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable, List

from PIL import Image, ImageOps

# Map the source image to a profile key
TARGETS: Dict[Path, str] = {
    Path("assets/img/hero-electronics-macro.jpg"): "hero",
    Path("assets/img/components-overview.jpg"): "hero",
    Path("assets/img/manufacturing-smt.jpg"): "content",
    Path("assets/img/lab-testing-bench.jpg"): "content",
    Path("assets/img/quality-control-meters.jpg"): "content",
}

# Widths to generate per profile
PROFILES: Dict[str, List[int]] = {
    "hero": [800, 1280, 1920],
    "content": [400, 640, 800],
}

QUALITY = 80


def save_variants(image: Image.Image, dest_dir: Path, stem: str, widths: Iterable[int]) -> None:
    """Save WebP and JPEG variants at the requested widths."""
    orig_w, orig_h = image.size

    for width in widths:
        target_w = min(width, orig_w)
        target_h = int(orig_h * (target_w / orig_w))

        resized = image if target_w == orig_w else image.resize((target_w, target_h), Image.LANCZOS)
        webp_path = dest_dir / f"{stem}-{target_w}.webp"
        jpg_path = dest_dir / f"{stem}-{target_w}.jpg"

        resized.save(webp_path, format="WEBP", quality=QUALITY, method=6)
        resized.save(jpg_path, format="JPEG", quality=QUALITY, optimize=True, progressive=True)

        print(f"Saved {webp_path.name} and {jpg_path.name} ({orig_w}x{orig_h} -> {target_w}x{target_h})")


def process_image(src_path: Path, profile: str) -> None:
    if not src_path.exists():
        print(f"Skip (missing): {src_path}")
        return

    widths = PROFILES.get(profile)
    if not widths:
        print(f"Skip (unknown profile '{profile}'): {src_path}")
        return

    dest_dir = src_path.parent
    dest_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(src_path) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        save_variants(im, dest_dir, src_path.stem, widths)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    for rel_path, profile in TARGETS.items():
        process_image(root / rel_path, profile)


if __name__ == "__main__":
    main()
