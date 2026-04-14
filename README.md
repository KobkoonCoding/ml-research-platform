# ML Research & Preprocessing Workspace

A professional web application for tabular data exploration, preprocessing, and model training. This workspace is designed to help researchers and data scientists diagnose data quality issues, apply reproducible preprocessing pipelines, and train Extreme Learning Machine (ELM) models with full visual feedback.

## 🚀 Key Features

*   **Interactive EDA Dashboard**: Auto-generated data quality diagnostics, distribution histograms, box plots, and correlation heatmaps.
*   **Preprocessing Workspace**:
    *   Handle missing values (Mean, Median, Mode, Constants, or Row/Col Drop).
    *   Outlier detection (IQR/Z-Score) and treatment (Remove or Cap/Floor).
    *   Feature Scaling (Standard, Min-Max, Robust) and Transformations (Log, Sqrt).
    *   Categorical Encoding (Label, One-Hot, Ordinal).
    *   Duplicate Handling & Type Cleaning.
*   **ELM Model Training**: Train Extreme Learning Machine models for classification or regression with Cross-Validation support.
*   **Professional Reporting**: Generate comprehensive PDF/HTML reports including dataset overview, pipeline history, and before/after comparisons.
*   **Pipeline Reproducibility**: Export preprocessing steps as JSON recipes or ready-to-use Python scripts.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Plotly.js for interactive charts, Vanilla CSS (Glassmorphism design).
*   **Backend**: FastAPI (Python), Pandas, Scikit-learn, NumPy.
*   **Report Engine**: React-based printable views with Plotly SVG export.

## 📂 Project Structure

```text
Research2/
├── backend/            # FastAPI Backend
│   ├── main.py         # Entry point & API endpoints
│   ├── preprocessing.py # Core cleaning logic
│   ├── elm_model.py    # ELM implementation
│   ├── cv_pipeline.py  # Cross-validation handler
│   └── sample_data/    # Titanic and other test datasets
├── frontend/           # React Frontend
│   ├── src/
│   │   ├── components/ # Core UI Modules (EDA, Preprocessing, etc.)
│   │   ├── App.jsx     # Navigation & State management
│   │   └── index.css   # Main design system
│   └── public/         # Static assets
└── README.md           # This file
```

## ⚙️ Setup & Installation

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*The API will run on `http://localhost:8000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The UI will run on `http://localhost:5173`*

## 🧑‍💻 For AI Agents & Developers
- **API Documentation**: Swagger is available at `http://localhost:8000/docs`.
- **State Management**: The frontend uses a centralized pipeline state in `PreprocessingWorkspace.jsx` to track every transformation.
- **Dataset Storage**: The backend holds the current dataset state in memory (`current_dataset`) for fast interactive previews.

---
*Created for Advanced ML Research and Data Engineering.*
