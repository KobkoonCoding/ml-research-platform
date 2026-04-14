"""Fetch 15 missing sample images for Module 3 demo tasks.

Sources (all permissive / research-allowed):
- COCO val2017 (CC-BY-4.0) — pose + general object detection samples
- HF datasets-server marmal88/skin_cancer (HAM10000 mirror, CC-BY-NC 4.0) — skin lesions
- GitHub SartajBhuvaji/Brain-Tumor-Classification-DataSet — brain MRIs

Run:
    python scripts/fetch_samples.py
"""

from __future__ import annotations

import sys
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

HEADERS = {
    "User-Agent": "Research2-SampleFetcher/1.0 (contact: dev@example.com)",
    "Accept": "*/*",
}

OUT_DIR = Path(r"D:\Research2\frontend\public\samples")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Direct-URL targets (no search needed)
# Format: (output_name, url)
DIRECT: list[tuple[str, str]] = [
    # Pose samples (COCO val2017 — CC-BY-4.0)
    ("pose-runner.jpg", "http://images.cocodataset.org/val2017/000000000785.jpg"),
    ("pose-yoga.jpg", "http://images.cocodataset.org/val2017/000000017905.jpg"),
    ("pose-dance.jpg", "http://images.cocodataset.org/val2017/000000174482.jpg"),
    ("pose-group.jpg", "http://images.cocodataset.org/val2017/000000001000.jpg"),
    # General objects (COCO val2017)
    ("street.jpg", "http://images.cocodataset.org/val2017/000000001584.jpg"),
    ("kitchen.jpg", "http://images.cocodataset.org/val2017/000000037777.jpg"),
    ("living-room.jpg", "http://images.cocodataset.org/val2017/000000004495.jpg"),
    ("office-desk.jpg", "http://images.cocodataset.org/val2017/000000014226.jpg"),
    # Brain MRI (SartajBhuvaji dataset — research use)
    (
        "brain-glioma.jpg",
        "https://raw.githubusercontent.com/SartajBhuvaji/Brain-Tumor-Classification-DataSet/master/Training/glioma_tumor/gg%20(1).jpg",
    ),
    (
        "brain-meningioma.jpg",
        "https://raw.githubusercontent.com/SartajBhuvaji/Brain-Tumor-Classification-DataSet/master/Training/meningioma_tumor/m%20(10).jpg",
    ),
    (
        "brain-pituitary.jpg",
        "https://raw.githubusercontent.com/SartajBhuvaji/Brain-Tumor-Classification-DataSet/master/Training/pituitary_tumor/p%20(1).jpg",
    ),
    (
        "brain-no-tumor.jpg",
        "https://raw.githubusercontent.com/SartajBhuvaji/Brain-Tumor-Classification-DataSet/master/Training/no_tumor/1.jpg",
    ),
]

# Skin lesions from HF datasets-server — URLs are signed & short-lived, so fetch fresh
# (output_name, target_dx, scan_start_offset)
SKIN_TARGETS: list[tuple[str, str, int]] = [
    ("skin-melanoma.jpg", "melanoma", 9000),
    ("skin-nevus.jpg", "melanocytic_Nevi", 3000),
    ("skin-bcc.jpg", "basal_cell_carcinoma", 400),
]


def download_and_save(url: str, out_path: Path, max_dim: int = 768) -> bool:
    try:
        r = requests.get(url, headers=HEADERS, timeout=30, stream=False)
        r.raise_for_status()
        img = Image.open(BytesIO(r.content)).convert("RGB")
        w, h = img.size
        scale = max_dim / max(w, h)
        if scale < 1:
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        img.save(out_path, format="JPEG", quality=85)
        return True
    except Exception as e:
        print(f"  FAIL {out_path.name}: {e}", file=sys.stderr)
        return False


def find_skin_sample(target_dx: str, start_offset: int) -> str | None:
    """Scan HF dataset-server rows to find an image with the given dx label.
    Returns a fresh signed CloudFront URL."""
    for offset in range(start_offset, start_offset + 2000, 50):
        try:
            r = requests.get(
                "https://datasets-server.huggingface.co/rows",
                params={
                    "dataset": "marmal88/skin_cancer",
                    "config": "default",
                    "split": "train",
                    "offset": offset,
                    "length": 1,
                },
                headers=HEADERS,
                timeout=15,
            )
            if r.status_code != 200:
                continue
            rows = r.json().get("rows", [])
            if not rows:
                continue
            row = rows[0].get("row", {})
            if row.get("dx") == target_dx:
                url = row.get("image", {}).get("src", "")
                if url:
                    return url
        except Exception:
            continue
    return None


def main() -> int:
    failures: list[str] = []

    print("=== Direct URL downloads (12 images) ===")
    for name, url in DIRECT:
        out = OUT_DIR / name
        if out.exists() and out.stat().st_size > 5000:
            print(f"[skip]  {name}")
            continue
        print(f"[dl]    {name} <- {url[:70]}...")
        if download_and_save(url, out):
            print(f"  -> saved {out.stat().st_size} bytes")
        else:
            failures.append(name)

    print("\n=== Skin lesion fetch via HF dataset-server (3 images) ===")
    for name, dx, start in SKIN_TARGETS:
        out = OUT_DIR / name
        if out.exists() and out.stat().st_size > 5000:
            print(f"[skip]  {name}")
            continue
        print(f"[find]  {name} <- dx={dx}")
        url = find_skin_sample(dx, start)
        if not url:
            print(f"  FAIL: no {dx} found")
            failures.append(name)
            continue
        if download_and_save(url, out):
            print(f"  -> saved {out.stat().st_size} bytes")
        else:
            failures.append(name)

    if failures:
        print(f"\nFAILED ({len(failures)}): {failures}")
        return 1
    print("\nAll 15 samples fetched OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
