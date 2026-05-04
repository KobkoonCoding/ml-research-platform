"""Generate a 1200x630 OG image for ML Research Platform.

Run: python scripts/gen_og_image.py
Output: frontend/public/og-image.png
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "og-image.png"
W, H = 1200, 630

# Background — dark gradient (#050505 -> #0a0a14)
img = Image.new("RGB", (W, H), color=(5, 5, 5))
draw = ImageDraw.Draw(img, "RGBA")

# Vertical gradient overlay
for y in range(H):
    t = y / H
    r = int(5 + 5 * t)
    g = int(5 + 5 * t)
    b = int(5 + 20 * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Decorative gradient blobs (radial-style fake using filled ellipses)
def blob(cx, cy, radius, color_rgba):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # Layered ellipses for soft glow
    for r, alpha_mult in [(radius, 0.05), (int(radius * 0.7), 0.10), (int(radius * 0.4), 0.18)]:
        a = int(color_rgba[3] * alpha_mult)
        od.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*color_rgba[:3], a))
    img.paste(overlay, (0, 0), overlay)

# Top-left primary blob (indigo)
blob(150, 100, 500, (99, 102, 241, 255))
# Bottom-right secondary blob (cyan)
blob(1050, 530, 450, (6, 182, 212, 255))
# Center pink accent
blob(750, 400, 250, (236, 72, 153, 255))

# Font loading — try a few candidates
def load_font(size, weight="bold"):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def regular_font(size):
    candidates = [
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


# Logo dot
draw.ellipse([80, 80, 120, 120], fill=(99, 102, 241))
draw.text((140, 78), "NEXUS", font=load_font(40), fill=(255, 255, 255))

# Subtitle pill
pill_text = "WHERE MATHEMATICS MEETS MACHINE LEARNING"
pill_font = load_font(18)
pill_bbox = draw.textbbox((0, 0), pill_text, font=pill_font)
pill_w = pill_bbox[2] - pill_bbox[0]
pill_h = pill_bbox[3] - pill_bbox[1]
px, py = 80, 230
draw.rounded_rectangle(
    [px - 20, py - 16, px + pill_w + 20, py + pill_h + 16],
    radius=999,
    fill=(255, 255, 255, 12),
    outline=(255, 255, 255, 38),
    width=1,
)
draw.text((px, py - 4), pill_text, font=pill_font, fill=(255, 255, 255, 220))

# Main title — two lines, second with gradient
title_font = load_font(120)
draw.text((80, 280), "Optimize.", font=title_font, fill=(255, 255, 255))

# "Learn." in gradient — fake by drawing twice with masks; here just a colorful single tone
gradient_y_top = 410
draw.text((80, gradient_y_top), "Learn.", font=title_font, fill=(165, 138, 240))

# Tagline
tag_font = regular_font(28)
draw.text(
    (80, 555),
    "A no-code platform · Data cleaning · ELM training · 9 live AI models",
    font=tag_font,
    fill=(255, 255, 255, 200),
)

# Bottom-right URL
url_font = load_font(20)
url_text = "ml-research-platform.vercel.app"
url_bbox = draw.textbbox((0, 0), url_text, font=url_font)
url_w = url_bbox[2] - url_bbox[0]
draw.text((W - url_w - 80, H - 50), url_text, font=url_font, fill=(255, 255, 255, 160))

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT, "PNG", optimize=True)
print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
