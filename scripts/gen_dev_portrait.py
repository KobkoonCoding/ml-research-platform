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

# Drop the roof/railing fragments GrabCut attaches below the left arm:
# they sit in the lower-right of the bbox and are either much darker than
# skin (shadowed roof) or strongly orange (painted railing).
gray_full = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
ys0, xs0 = np.where(person > 0)
bx0, bx1, by0, by1 = xs0.min(), xs0.max(), ys0.min(), ys0.max()
bw, bh = bx1 - bx0, by1 - by0
yy, xx = np.mgrid[0:sh, 0:sw]
bf, gf, rf = small[..., 0].astype(np.int32), small[..., 1].astype(np.int32), small[..., 2].astype(np.int32)
orange = (rf > 110) & (rf * 10 > gf * 14)
zone = (xx > bx0 + 0.70 * bw) & (yy > by0 + 0.36 * bh)
person[zone & ((gray_full < 75) | orange)] = 0
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

crop_col = small[y0:y1, x0:x1]
crop_mask = person[y0:y1, x0:x1]

# Brightness normalize + saturation boost so the photo's colors survive
# the dark additive-blend particle rendering on the landing page
gray = cv2.cvtColor(crop_col, cv2.COLOR_BGR2GRAY)
inside = gray[crop_mask > 0]
hi = float(np.percentile(inside, 97))
crop_col = np.clip(crop_col.astype(np.float32) * (232.0 / max(1.0, hi)), 0, 255).astype(np.uint8)
hsv = cv2.cvtColor(crop_col, cv2.COLOR_BGR2HSV).astype(np.float32)
hsv[..., 1] = np.clip(hsv[..., 1] * 1.3, 0, 255)
crop_col = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

# Final asset ~260px wide (RGB = photo color, A = person mask)
tw = 260
th = int(crop_col.shape[0] * tw / crop_col.shape[1])
col = cv2.resize(crop_col, (tw, th), interpolation=cv2.INTER_AREA)
a = cv2.resize(crop_mask, (tw, th), interpolation=cv2.INTER_AREA)
a = cv2.GaussianBlur(a, (3, 3), 0)

b, gch, r = cv2.split(col)
rgba = cv2.merge([b, gch, r, a])
cv2.imwrite(OUT, rgba)
print("wrote", OUT, tw, "x", th)

# Preview on dark background for visual check
bg = np.full((th, tw, 3), 12, np.uint8)
af = (a.astype(np.float32) / 255)[..., None]
prev = (bg * (1 - af) + col * af).astype(np.uint8)
cv2.imwrite(PREVIEW, prev)
print("wrote preview")
