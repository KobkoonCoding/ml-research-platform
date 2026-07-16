"""Regenerate frontend/public/dev-portrait.png from the developer photo.

GrabCut extracts the person, then bakes a small RGBA asset:
RGB = photo luminance, A = person mask. The landing page's
ParticlePortrait component samples opaque pixels from it.

Usage (from repo root): python scripts/gen_dev_portrait.py [path-to-photo]
Requires: opencv-python, numpy. The rect/cleanup constants below are tuned
for the arms-crossed photo used in July 2026 — re-tune for a new photo.
"""
import sys

import cv2
import numpy as np

SRC = sys.argv[1] if len(sys.argv) > 1 else r"New Landing page/animated-landing-page-design/profile img.jpg"
OUT = "frontend/public/dev-portrait.png"
PREVIEW = "dev-portrait-preview.png"  # dropped at repo root for a visual check

img = cv2.imread(SRC)
h, w = img.shape[:2]
print("source", w, "x", h)

# Work at reduced size for speed; GrabCut is O(pixels * iters)
scale = 900 / max(h, w)
small = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
sh, sw = small.shape[:2]

# Rect around the person (centered, arms crossed) — generous margins
rect = (int(sw * 0.30), int(sh * 0.09), int(sw * 0.52), int(sh * 0.88))
mask = np.zeros((sh, sw), np.uint8)
bgd = np.zeros((1, 65), np.float64)
fgd = np.zeros((1, 65), np.float64)
cv2.grabCut(small, mask, rect, bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
person = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

# Clean up: keep largest component, close holes, light feather
n, labels, stats, _ = cv2.connectedComponentsWithStats(person, 8)
if n > 1:
    biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    person = np.where(labels == biggest, 255, 0).astype(np.uint8)
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
person = cv2.morphologyEx(person, cv2.MORPH_CLOSE, kernel, iterations=2)
person = cv2.morphologyEx(person, cv2.MORPH_OPEN, kernel, iterations=1)

# Drop the roof fragment GrabCut attaches below the left arm: it sits in
# the lower-right of the bbox AND is much darker than skin/shirt there.
gray_full = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
ys0, xs0 = np.where(person > 0)
bx0, bx1, by0, by1 = xs0.min(), xs0.max(), ys0.min(), ys0.max()
bw, bh = bx1 - bx0, by1 - by0
yy, xx = np.mgrid[0:sh, 0:sw]
roof = (xx > bx0 + 0.70 * bw) & (yy > by0 + 0.36 * bh) & (gray_full < 75)
person[roof] = 0
# re-clean after the cut
person = cv2.morphologyEx(person, cv2.MORPH_OPEN, kernel, iterations=1)
n2, labels2, stats2, _ = cv2.connectedComponentsWithStats(person, 8)
if n2 > 1:
    biggest2 = 1 + int(np.argmax(stats2[1:, cv2.CC_STAT_AREA]))
    person = np.where(labels2 == biggest2, 255, 0).astype(np.uint8)

# Bust crop: head + shoulders + crossed arms (upper ~72% of the mask bbox)
ys, xs = np.where(person > 0)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
y1 = y0 + int((y1 - y0) * 0.72)
pad = int(0.03 * sw)
x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
x1, y1 = min(sw, x1 + pad), min(sh, y1 + pad)

gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
crop_gray = gray[y0:y1, x0:x1]
crop_mask = person[y0:y1, x0:x1]

# Slight contrast stretch inside the person so facial features survive
inside = crop_gray[crop_mask > 0]
lo, hi = np.percentile(inside, 3), np.percentile(inside, 97)
crop_gray = np.clip((crop_gray.astype(np.float32) - lo) / max(1, hi - lo) * 255, 0, 255).astype(np.uint8)

# Final asset ~260px wide
tw = 260
th = int(crop_gray.shape[0] * tw / crop_gray.shape[1])
g = cv2.resize(crop_gray, (tw, th), interpolation=cv2.INTER_AREA)
a = cv2.resize(crop_mask, (tw, th), interpolation=cv2.INTER_AREA)
a = cv2.GaussianBlur(a, (3, 3), 0)

rgba = cv2.merge([g, g, g, a])
cv2.imwrite(OUT, rgba)
print("wrote", OUT, tw, "x", th)

# Preview on dark background for visual check
bg = np.full((th, tw, 3), 12, np.uint8)
af = (a.astype(np.float32) / 255)[..., None]
prev = (bg * (1 - af) + cv2.merge([g, g, g]) * af).astype(np.uint8)
cv2.imwrite(PREVIEW, prev)
print("wrote preview")
