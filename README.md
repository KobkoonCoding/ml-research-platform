# NEXUS — ML Research Platform

> A no-code research platform fusing **mathematical optimization** with machine
> learning. Built by **Dr. Kobkoon Janngam** at the Department of Mathematics,
> Chiang Mai University.

🌐 **Live demo**: [https://ml-research-platform.vercel.app/](https://ml-research-platform.vercel.app/)

📑 **Citation**: see [/about](https://ml-research-platform.vercel.app/about) for BibTeX

---

## What is this?

NEXUS is a research showcase covering the **full ML lifecycle in three modules**:

| Module | Path | Purpose |
|---|---|---|
| **Data Forensic & Cleaning** | [`/forensic`](https://ml-research-platform.vercel.app/forensic) | Automated EDA + leakage-safe preprocessing pipeline (missing values, outliers, encoding, scaling, imbalance, feature selection) |
| **ELM Studio** | [`/elm-studio`](https://ml-research-platform.vercel.app/elm-studio) | Train Extreme Learning Machine models — closed-form least-squares with cross-validation, learning curves, calibration diagrams, model export |
| **AI Model Hub** | [`/deep-learning`](https://ml-research-platform.vercel.app/deep-learning) | Pretrained vision models — ImageNet/Food/Birds classification, chest X-ray + skin + brain MRI medical imaging with Grad-CAM, YOLOv8 detection |

## Research themes

- **Mathematical optimization for ML** — fixed-point algorithms, Banach contraction
- **Extreme Learning Machine (ELM) convex reformulation** — replacing the
  random-projection heuristic with a principled convex objective
- **Pipeline-bound preprocessing** — zero data leakage in cross-validation
- **Pretrained-model interpretability** — Grad-CAM / attention rollout overlays

## Key features

### Data Forensic
- Three correlation methods (Pearson, Spearman, Kendall) auto-computed
- Per-column distribution stats — skewness, kurtosis, normality hints
- Cramér's V categorical-association heatmap
- Per-tool leakage badges (`GLOBAL` / `PER-FOLD` / `TARGET`)
- Smart default missing-value strategy (median for skewed numeric)
- Export: cleaned CSV/Excel + reproducible Python pipeline script

### ELM Studio
- Adaptive default hidden nodes = `10 × features` capped by sample size
- 3 activations (sigmoid, ReLU, tanh)
- K-fold / Stratified K-fold / stratified Holdout
- Learning curve + calibration diagram (binary)
- Model export as `.joblib` bundle (model + scaler + label encoder + features)
- Compare Runs table — last 10 trainings persisted in browser

### AI Model Hub
- **Image Classification**: EfficientNetV2-S (83.9% top-1 ImageNet)
- **Medical Imaging**: torchxrayvision DenseNet121 (18 pathologies + Grad-CAM),
  ISIC dermoscopy ViT, BraTS-style brain MRI ViT — research only
- **Object Detection**: YOLOv8n animals + 17-keypoint pose + 80-class COCO

## Tech stack

**Frontend**: React 19 · Vite 7 · Tailwind CSS · Framer Motion · Plotly.js · react-helmet-async

**Backend**: FastAPI · pandas · scikit-learn · imbalanced-learn · PyTorch · torchvision · joblib · pyarrow

## Multi-user support

Backend uses lightweight per-tab session isolation via the `X-Session-Id`
header — concurrent users get independent dataset / pipeline / trained-model
state. See `backend/main.py:get_session()`.

## Local development

### Backend
```bash
cd backend
python -m venv venv
venv/Scripts/activate         # Windows
# source venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
python main.py                # http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

## Smoke tests

End-to-end + concurrency stress tests live in `backend/`:
```bash
python smoke_e2e.py          # 22 endpoint checks
python smoke_concurrent.py   # 10 parallel sessions
```

## Licensing

This is a **research showcase** — not a commercial product. Bundled
components retain their original licenses. The full license matrix lives at
[/about](https://ml-research-platform.vercel.app/about).

⚠️ **AGPL-3.0 caveat**: YOLOv8 (Ultralytics) is strong-copyleft. Production /
commercial deployments must replace it or obtain a commercial license.

⚠️ **Medical disclaimer**: All medical-imaging models are research-only
pattern-matching tools and are NOT FDA-cleared. Only qualified specialists
can diagnose medical images.

## Citation

```bibtex
@misc{nexus_ml_research_platform_2026,
  title  = {NEXUS — ML Research Platform},
  author = {Kobkoon Janngam},
  year   = {2026},
  note   = {Research showcase, Department of Mathematics, Chiang Mai University},
  url    = {https://ml-research-platform.vercel.app/}
}
```

## Acknowledgements

ImageNet · COCO 2017 · torchxrayvision · ISIC 2019 · scikit-learn · PyTorch

---

*Department of Mathematics · Chiang Mai University · Thailand*

**Keywords**: machine learning, mathematical optimization, fixed-point
algorithm, Extreme Learning Machine, ELM, no-code ML, data preprocessing,
chest X-ray AI, Grad-CAM, YOLOv8, scikit-learn, FastAPI, React, Vercel,
Chiang Mai University, ML research showcase.
