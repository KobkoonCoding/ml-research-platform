from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import io
import os
import datetime
from fastapi.responses import Response

from preprocessing import (
    analyze_dataset,
    preprocess_missing_values,
    remove_outliers,
    solve_imbalance,
    handle_duplicates,
    clean_data_types,
    encode_categorical,
    scale_features,
    feature_selection,
    split_dataset,
    drop_columns,
)
from elm_model import ELMClassifier, ELMRegressor
from sklearn.model_selection import KFold, StratifiedKFold, train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score, roc_curve, precision_recall_curve
from cv_pipeline import apply_pipeline_cv
import time
import json
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from PIL import Image

# ONNX Runtime for lightweight image classification (Module 3)
# Uses ~100MB RAM vs PyTorch's ~1.5GB
try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False

app = FastAPI(title="ML Research App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

original_dataset: Optional[pd.DataFrame] = None
current_dataset: Optional[pd.DataFrame] = None
pipeline_history: List[dict] = []
dataset_snapshots: List[pd.DataFrame] = []  # for undo

# Persistent training state for Module 2 real-time prediction
last_trained_info = {
    "model": None,
    "scaler": None,
    "label_encoder": None,
    "features": [],
    "target": None,
    "problem_type": None,
    "activation": "sigmoid"
}


class PreprocessRequest(BaseModel):
    action: str
    params: dict = {}


class TrainELMRequest(BaseModel):
    target_column: str
    problem_type: str = "classification"
    features: List[str] = []
    
    # Split config
    split_strategy: str = "kfold"  # holdout, kfold, stratified_kfold
    num_folds: int = 5
    test_size: float = 0.2
    shuffle: bool = True
    random_seed: int = 42
    
    # ELM Hyperparams
    hidden_nodes: int = 100
    activation: str = "sigmoid"
    bias: bool = True
    repeats: int = 1


class PredictRequest(BaseModel):
    data: dict


class ImagePredictResponse(BaseModel):
    prediction: str
    confidence: float
    all_scores: dict = {}


def _require_dataset():
    if current_dataset is None:
        raise HTTPException(status_code=404, detail="No dataset uploaded.")


# ─── Upload ───
@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    global original_dataset, current_dataset, pipeline_history, dataset_snapshots
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Upload CSV or Excel.")

        original_dataset = df.copy()
        current_dataset = df.copy()
        pipeline_history = []
        dataset_snapshots = []

        return {
            "message": "File uploaded successfully",
            "filename": file.filename,
            "analysis": analyze_dataset(current_dataset),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Demo Dataset ───
@app.get("/demo/{dataset_name}")
def load_demo(dataset_name: str):
    global original_dataset, current_dataset, pipeline_history, dataset_snapshots
    file_path = f"sample_data/{dataset_name}.csv"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Demo dataset not found.")
    
    try:
        df = pd.read_csv(file_path)
        original_dataset = df.copy()
        current_dataset = df.copy()
        pipeline_history = []
        dataset_snapshots = []
        return {"message": f"Demo {dataset_name} loaded", "analysis": analyze_dataset(current_dataset)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Analyze ───
@app.get("/analyze")
def analyze():
    _require_dataset()
    return analyze_dataset(current_dataset)


# ─── Apply preprocessing ───
def _apply_action(df: pd.DataFrame, action: str, params: dict) -> pd.DataFrame:
    """Apply a single preprocessing action and return the new DataFrame."""
    print(f"DEBUG: Applying action '{action}' with params: {params}")

    if action == "missing":
        strategy = params.get("strategy", "mean")
        columns = params.get("columns")  # optional: list of column names
        print(f"DEBUG: Missing Value Strategy: {strategy}, Columns: {columns}")
        result = preprocess_missing_values(df, strategy, columns)
        print(f"DEBUG: Missing Values Before: {df.isnull().sum().sum()}, After: {result.isnull().sum().sum()}")
        return result

    elif action == "duplicates":
        keep = params.get("keep", "first")
        return handle_duplicates(df, keep)

    elif action == "outliers":
        method = params.get("method", "iqr")
        treatment = params.get("treatment", "remove")
        columns = params.get("columns")
        threshold = float(params.get("threshold", 1.5 if method == "iqr" else 3.0))
        return remove_outliers(df, method, threshold, treatment, columns)

    elif action == "type_cleaning":
        column = params.get("column")
        sub_action = params.get("sub_action", "trim")
        return clean_data_types(df, column, sub_action)

    elif action == "encoding":
        column = params.get("column")
        method = params.get("method", "label")
        target_column = params.get("target_column")
        return encode_categorical(df, column, method, target_column)

    elif action == "scaling":
        columns = params.get("columns")
        method = params.get("method", "standard")
        return scale_features(df, columns, method)

    elif action == "imbalance":
        target_col = params.get("target_column")
        method = params.get("method", "smote")
        if not target_col:
            raise ValueError("Target column required for imbalance handling.")
        return solve_imbalance(df, target_col, method)

    elif action == "feature_selection":
        method = params.get("method", "variance")
        threshold = float(params.get("threshold", 0.0))
        target_col = params.get("target_column")
        k_features = int(params.get("k", 10))
        return feature_selection(df, method, threshold, target_col, k_features)

    elif action == "split":
        test_size = float(params.get("test_size", 0.2))
        stratify_col = params.get("stratify_col")
        random_state = int(params.get("random_state", 42))
        return split_dataset(df, test_size, stratify_col, random_state)

    elif action == "drop_columns":
        cols = params.get("columns", [])
        return drop_columns(df, cols)

    else:
        raise ValueError(f"Unknown action: {action}")


@app.post("/preprocess")
def preprocess(req: PreprocessRequest):
    global current_dataset
    _require_dataset()

    try:
        # Save snapshot for undo
        dataset_snapshots.append(current_dataset.copy())

        new_df = _apply_action(current_dataset, req.action, req.params)
        current_dataset = new_df

        # Record step
        step = {
            "step": len(pipeline_history) + 1,
            "action": req.action,
            "params": req.params,
            "timestamp": datetime.datetime.now().isoformat(),
            "rows_before": dataset_snapshots[-1].shape[0],
            "cols_before": dataset_snapshots[-1].shape[1],
            "rows_after": current_dataset.shape[0],
            "cols_after": current_dataset.shape[1],
        }
        pipeline_history.append(step)

        return {
            "message": f"Step {step['step']}: {req.action} applied successfully.",
            "step": step,
            "analysis": analyze_dataset(current_dataset),
            "pipeline": pipeline_history,
        }
    except Exception as e:
        # Rollback snapshot
        if dataset_snapshots:
            dataset_snapshots.pop()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Preview (dry-run) ───
@app.post("/preprocess/preview")
def preprocess_preview(req: PreprocessRequest):
    _require_dataset()
    try:
        preview_df = _apply_action(current_dataset.copy(), req.action, req.params)
        return {
            "before": {
                "rows": current_dataset.shape[0],
                "cols": current_dataset.shape[1],
                "missing": int(current_dataset.isnull().sum().sum()),
                "analysis": analyze_dataset(current_dataset),
            },
            "after": {
                "rows": preview_df.shape[0],
                "cols": preview_df.shape[1],
                "missing": int(preview_df.isnull().sum().sum()),
                "analysis": analyze_dataset(preview_df),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ─── Python Pipeline Export Helper ───
def generate_python_script(pipeline):
    code = [
        "import pandas as pd",
        "import numpy as np",
        "from scipy import stats",
        "",
        "def preprocess_data(file_path):",
        "    df = pd.read_csv(file_path)",
        "    print('Original shape:', df.shape)",
        ""
    ]
    
    for i, step in enumerate(pipeline):
        action = step['action']
        p = step['params']
        code.append(f"    # Step {i+1}: {action}")
        
        if action == 'missing':
            strat = p.get('strategy')
            cols = p.get('columns')
            c_str = f"{cols}" if cols else "df.columns"
            if strat == 'drop': code.append(f"    df = df.dropna(subset={c_str})")
            elif strat == 'drop_cols': code.append(f"    df = df.drop(columns=[c for c in {c_str} if df[c].isnull().any()])")
            elif strat == 'mean': 
                code.append(f"    for c in {c_str}:\n        if pd.api.types.is_numeric_dtype(df[c]): df[c] = df[c].fillna(df[c].mean())")
            elif strat == 'median':
                code.append(f"    for c in {c_str}:\n        if pd.api.types.is_numeric_dtype(df[c]): df[c] = df[c].fillna(df[c].median())")
            elif strat == 'mode':
                code.append(f"    for c in {c_str}:\n        df[c] = df[c].fillna(df[c].mode()[0])")
            elif strat == 'constant':
                code.append(f"    for c in {c_str}:\n        df[c] = df[c].fillna(0)")
                
        elif action == 'duplicates':
            keep = p.get('keep', 'first')
            if keep == 'false': keep = False
            else: keep = f"'{keep}'"
            code.append(f"    df = df.drop_duplicates(keep={keep})")
            
        elif action == 'outliers':
            method = p.get('method')
            treat = p.get('treatment')
            thresh = p.get('threshold')
            cols = p.get('columns')
            if not cols: code.append(f"    num_cols = df.select_dtypes(include=[np.number]).columns")
            else: code.append(f"    num_cols = {cols}")
            
            if method == 'zscore':
                code.append(f"    for c in num_cols:")
                code.append(f"        z = np.abs(stats.zscore(df[c].dropna()))")
                code.append(f"        outliers = df[c].dropna().index[z >= {thresh}]")
                if treat == 'remove': code.append(f"        df = df.drop(index=outliers)")
                elif treat == 'cap':
                    code.append(f"        m, s = df[c].mean(), df[c].std()")
                    code.append(f"        df[c] = df[c].clip(lower=m - {thresh}*s, upper=m + {thresh}*s)")
                elif treat == 'null': code.append(f"        df.loc[outliers, c] = np.nan")
            elif method == 'iqr':
                code.append(f"    for c in num_cols:")
                code.append(f"        Q1, Q3 = df[c].quantile(0.25), df[c].quantile(0.75)")
                code.append(f"        IQR = Q3 - Q1")
                code.append(f"        lower, upper = Q1 - {thresh}*IQR, Q3 + {thresh}*IQR")
                if treat == 'remove':
                    code.append(f"        df = df[~((df[c] < lower) | (df[c] > upper)) | df[c].isna()]")
                elif treat == 'cap': code.append(f"        df[c] = df[c].clip(lower=lower, upper=upper)")
                elif treat == 'null': code.append(f"        df.loc[(df[c] < lower) | (df[c] > upper), c] = np.nan")
                
        elif action == 'type_cleaning':
            col = p.get('column')
            act = p.get('sub_action')
            if act == 'trim': code.append(f"    if df['{col}'].dtype == 'object': df['{col}'] = df['{col}'].str.strip()")
            elif act == 'lowercase': code.append(f"    if df['{col}'].dtype == 'object': df['{col}'] = df['{col}'].str.lower()")
            elif act == 'uppercase': code.append(f"    if df['{col}'].dtype == 'object': df['{col}'] = df['{col}'].str.upper()")
            elif act == 'to_numeric': code.append(f"    df['{col}'] = pd.to_numeric(df['{col}'], errors='coerce')")
            elif act == 'to_datetime': code.append(f"    df['{col}'] = pd.to_datetime(df['{col}'], errors='coerce')")
            elif act == 'remove_special': code.append(f"    if df['{col}'].dtype == 'object': df['{col}'] = df['{col}'].str.replace(r'[^a-zA-Z0-9\\s]', '', regex=True)")
            
        elif action == 'encoding':
            col = p.get('column')
            meth = p.get('method')
            tgt = p.get('target_column')
            if meth in ['label', 'ordinal']:
                code.append(f"    df['{col}'] = df['{col}'].astype('category').cat.codes")
            elif meth == 'onehot':
                code.append(f"    df = pd.concat([df.drop(columns=['{col}']), pd.get_dummies(df['{col}'], prefix='{col}')], axis=1)")
            elif meth == 'frequency':
                code.append(f"    df['{col}'] = df['{col}'].map(df['{col}'].value_counts(normalize=True))")
            elif meth == 'target':
                code.append(f"    tgt = df['{tgt}']")
                code.append(f"    if not pd.api.types.is_numeric_dtype(tgt): tgt = tgt.astype('category').cat.codes")
                code.append(f"    df['{col}'] = df['{col}'].map(tgt.groupby(df['{col}']).mean()).fillna(tgt.mean())")
                
        elif action == 'scaling':
            cols = p.get('columns')
            meth = p.get('method')
            c_str = f"{cols}" if cols else "df.select_dtypes(include=[np.number]).columns"
            if meth == 'standard':
                code.append(f"    for c in {c_str}:\n        if df[c].std() > 0: df[c] = (df[c] - df[c].mean()) / df[c].std()")
            elif meth == 'minmax':
                code.append(f"    for c in {c_str}:\n        if df[c].max() > df[c].min(): df[c] = (df[c] - df[c].min()) / (df[c].max() - df[c].min())")
            elif meth == 'robust':
                code.append(f"    for c in {c_str}:\n        iqr = df[c].quantile(0.75) - df[c].quantile(0.25)\n        if iqr > 0: df[c] = (df[c] - df[c].median()) / iqr")
            elif meth == 'log':
                code.append(f"    for c in {c_str}:\n        df[c] = np.log1p(df[c]) if (df[c].dropna() >= 0).all() else df[c]")
            elif meth == 'sqrt':
                code.append(f"    for c in {c_str}:\n        if (df[c].dropna() >= 0).all(): df[c] = np.sqrt(df[c])")
            elif meth == 'boxcox':
                code.append(f"    for c in {c_str}:\n        if (df[c].dropna() > 0).all(): df.loc[df[c].notnull(), c], _ = stats.boxcox(df[c].dropna())")
            elif meth == 'yeojohnson':
                code.append(f"    for c in {c_str}:\n        df.loc[df[c].notnull(), c], _ = stats.yeojohnson(df[c].dropna())")
            
        elif action == 'feature_selection':
            meth = p.get('method')
            thresh = p.get('threshold')
            tgt = p.get('target_column')
            code.append(f"    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()")
            if meth == 'variance':
                code.append(f"    from sklearn.feature_selection import VarianceThreshold")
                code.append(f"    vt = VarianceThreshold(threshold={thresh})")
                code.append(f"    X = df[num_cols].fillna(df[num_cols].mean()).fillna(0)")
                code.append(f"    vt.fit(X)")
                code.append(f"    drop_cols = [num_cols[i] for i in range(len(num_cols)) if vt.variances_[i] <= {thresh}]")
                if tgt: code.append(f"    if '{tgt}' in drop_cols: drop_cols.remove('{tgt}')")
                code.append(f"    df = df.drop(columns=drop_cols)")
            elif meth == 'correlation':
                code.append(f"    corr = df[num_cols].corr().abs()")
                code.append(f"    upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))")
                code.append(f"    drop_cols = [c for c in upper.columns if any(upper[c] > {thresh})]")
                if tgt: code.append(f"    if '{tgt}' in drop_cols: drop_cols.remove('{tgt}')")
                code.append(f"    df = df.drop(columns=drop_cols)")
            elif meth in ['kbest', 'mutual_info']:
                k = p.get('k')
                code.append(f"    from sklearn.feature_selection import SelectKBest, f_classif, f_regression, mutual_info_classif, mutual_info_regression")
                code.append(f"    tgt = '{tgt}'")
                code.append(f"    if tgt in num_cols: num_cols.remove(tgt)")
                code.append(f"    X = df[num_cols].fillna(df[num_cols].mean()).fillna(0)")
                code.append(f"    y = df[tgt]")
                code.append(f"    is_class = not pd.api.types.is_numeric_dtype(y) or y.nunique() <= 20")
                code.append(f"    y_enc = y.astype('category').cat.codes if is_class else y")
                if meth == 'kbest':
                    code.append(f"    score_func = f_classif if is_class else f_regression")
                else:
                    code.append(f"    score_func = mutual_info_classif if is_class else mutual_info_regression")
                code.append(f"    selector = SelectKBest(score_func=score_func, k=min({k}, len(num_cols)))")
                code.append(f"    selector.fit(X, y_enc)")
                code.append(f"    keep_cols = [num_cols[i] for i in range(len(num_cols)) if selector.get_support()[i]]")
                code.append(f"    df = df.drop(columns=[c for c in num_cols if c not in keep_cols])")
                
        elif action == 'imbalance':
            meth = p.get('method')
            tgt = p.get('target_column')
            code.append(f"    from imblearn.over_sampling import SMOTE, RandomOverSampler")
            code.append(f"    from imblearn.under_sampling import RandomUnderSampler")
            code.append(f"    from imblearn.combine import SMOTEENN")
            code.append(f"    X = df.drop(columns=['{tgt}'])")
            code.append(f"    y = df['{tgt}']")
            code.append(f"    for c in X.select_dtypes(include=['object', 'category']).columns: X[c] = X[c].astype('category').cat.codes")
            if meth == 'smote': code.append(f"    sampler = SMOTE(random_state=42)")
            elif meth == 'random_over': code.append(f"    sampler = RandomOverSampler(random_state=42)")
            elif meth == 'random_under': code.append(f"    sampler = RandomUnderSampler(random_state=42)")
            elif meth == 'smote_enn': code.append(f"    sampler = SMOTEENN(random_state=42)")
            code.append(f"    X_res, y_res = sampler.fit_resample(X, y.astype('category').cat.codes)")
            code.append(f"    df = pd.DataFrame(X_res, columns=X.columns)")
            code.append(f"    df['{tgt}'] = y_res")
            
        code.append("")
        
    code.append("    print('Final shape:', df.shape)")
    code.append("    return df")
    code.append("")
    code.append("if __name__ == '__main__':")
    code.append("    # df_clean = preprocess_data('your_dataset.csv')")
    code.append("    # df_clean.to_csv('cleaned_data.csv', index=False)")
    code.append("")
    
    return "\n".join(code)


# ─── Undo ───
@app.post("/undo")
def undo():
    global current_dataset
    _require_dataset()
    if not dataset_snapshots:
        raise HTTPException(status_code=400, detail="Nothing to undo.")

    current_dataset = dataset_snapshots.pop()
    removed = pipeline_history.pop() if pipeline_history else None

    return {
        "message": f"Undid step: {removed['action']}" if removed else "Undo done.",
        "analysis": analyze_dataset(current_dataset),
        "pipeline": pipeline_history,
    }


# ─── Reset ───
@app.post("/reset")
def reset():
    global current_dataset, pipeline_history, dataset_snapshots
    if original_dataset is None:
        raise HTTPException(status_code=404, detail="No dataset uploaded.")

    current_dataset = original_dataset.copy()
    pipeline_history = []
    dataset_snapshots = []

    return {
        "message": "Dataset reset to original.",
        "analysis": analyze_dataset(current_dataset),
        "pipeline": [],
    }


# ─── Pipeline History ───
@app.get("/pipeline")
def get_pipeline():
    return {"pipeline": pipeline_history}


# ─── Export Dataset ───
@app.get("/export/dataset/{export_format}")
def export_dataset(export_format: str):
    _require_dataset()
    
    if export_format.lower() == "csv":
        stream = io.StringIO()
        current_dataset.to_csv(stream, index=False)
        response = Response(content=stream.getvalue(), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=cleaned_dataset.csv"
        return response
    elif export_format.lower() in ["xls", "xlsx", "excel"]:
        stream = io.BytesIO()
        try:
            with pd.ExcelWriter(stream, engine='openpyxl') as writer:
                current_dataset.to_excel(writer, index=False, sheet_name='CleanedData')
        except Exception as e:
            # Catch both ImportError and any other writing errors
            error_msg = str(e)
            if "openpyxl" in error_msg.lower() or isinstance(e, ImportError):
                raise HTTPException(status_code=500, detail="openpyxl is missing. Please run: python -m pip install openpyxl and restart backend.")
            raise HTTPException(status_code=500, detail=f"Excel Export Error: {error_msg}")
        response = Response(content=stream.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response.headers["Content-Disposition"] = f"attachment; filename=cleaned_dataset.xlsx"
        return response
    elif export_format.lower() == "python":
        script_content = generate_python_script(pipeline_history)
        response = Response(content=script_content, media_type="text/x-python")
        response.headers["Content-Disposition"] = "attachment; filename=pipeline.py"
        return response
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format.")


# ─── ELM Training ───
@app.post("/train")
def train_model(req: TrainELMRequest):
    _require_dataset()
    if req.target_column not in original_dataset.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{req.target_column}' not found.")

    try:
        # Separate Global vs Fold-specific actions to prevent leakage and improve performance
        global_actions = ["duplicates", "drop_columns", "type_cleaning"]
        global_steps = [s for s in pipeline_history if s['action'] in global_actions]
        cv_history = [s for s in pipeline_history if s['action'] not in global_actions]

        # 1. Apply Global Preprocessing (Stateless)
        df_prepared = original_dataset.copy()
        for step in global_steps:
            df_prepared = _apply_action(df_prepared, step['action'], step['params'])
            
        df_raw = df_prepared
        y_raw = df_raw[req.target_column]
        
        fold_results = []
        is_classification = req.problem_type == "classification"
        
        for repeat in range(req.repeats):
            seed = req.random_seed + repeat
            
            splits = []
            if req.split_strategy == "holdout":
                train_idx, test_idx = train_test_split(
                    np.arange(len(df_raw)), 
                    test_size=req.test_size, 
                    random_state=seed, 
                    shuffle=req.shuffle,
                    stratify=y_raw if (req.shuffle and is_classification) else None
                )
                splits.append((train_idx, test_idx))
            else:
                if req.split_strategy == "stratified_kfold" and is_classification:
                    cv = StratifiedKFold(n_splits=req.num_folds, shuffle=req.shuffle, random_state=seed if req.shuffle else None)
                    splits = list(cv.split(df_raw, y_raw))
                else:
                    cv = KFold(n_splits=req.num_folds, shuffle=req.shuffle, random_state=seed if req.shuffle else None)
                    splits = list(cv.split(df_raw))
            
            for fold_idx, (train_idx, test_idx) in enumerate(splits, 1):
                start_time = time.time()
                
                df_train_raw = df_raw.iloc[train_idx]
                df_test_raw = df_raw.iloc[test_idx]
                
                # Apply preprocessing WITHOUT LEAKAGE (Only stateful steps learned per fold)
                df_train_proc, df_test_proc = apply_pipeline_cv(df_train_raw, df_test_raw, cv_history)
                
                # Drop NAs
                df_train_proc = df_train_proc.dropna(subset=[req.target_column])
                df_test_proc = df_test_proc.dropna(subset=[req.target_column])
                
                X_train = df_train_proc.drop(columns=[req.target_column])
                y_train = df_train_proc[req.target_column]
                X_test = df_test_proc.drop(columns=[req.target_column])
                y_test = df_test_proc[req.target_column]
                
                # Only use selected features if any
                if req.features:
                    X_train = X_train[[c for c in req.features if c in X_train.columns]]
                    X_test = X_test[[c for c in req.features if c in X_test.columns]]
                    
                # Encode target if classification and not numeric yet
                if is_classification:
                    from sklearn.preprocessing import LabelEncoder
                    le = LabelEncoder()
                    y_train = le.fit_transform(y_train)
                    y_test = le.transform(y_test)
                
                # Train ELM
                if is_classification:
                    elm = ELMClassifier(hidden_nodes=req.hidden_nodes, activation=req.activation, random_state=seed)
                else:
                    elm = ELMRegressor(hidden_nodes=req.hidden_nodes, activation=req.activation, random_state=seed)
                    
                elm.fit(X_train, y_train)
                y_pred = elm.predict(X_test)
                
                # Evaluate
                metrics = {}
                cm_list = None
                curve_data = None
                
                if is_classification:
                    is_multiclass = len(np.unique(y_train)) > 2
                    avg = 'macro' if is_multiclass else 'binary'
                    metrics['accuracy'] = float(accuracy_score(y_test, y_pred))
                    metrics['precision'] = float(precision_score(y_test, y_pred, average=avg, zero_division=0))
                    metrics['recall'] = float(recall_score(y_test, y_pred, average=avg, zero_division=0))
                    metrics['f1_score'] = float(f1_score(y_test, y_pred, average=avg, zero_division=0))
                    
                    try:
                        H_test = elm._activate(np.dot(X_test.values.astype(np.float64), elm.input_weights_) + elm.biases_)
                        y_pred_proba = np.dot(H_test, elm.output_weights_)
                        exp_p = np.exp(y_pred_proba - np.max(y_pred_proba, axis=1, keepdims=True))
                        y_pred_proba = exp_p / np.sum(exp_p, axis=1, keepdims=True)
                        
                        if is_multiclass:
                            metrics['roc_auc'] = float(roc_auc_score(y_test, y_pred_proba, multi_class='ovr'))
                        else:
                            probs = y_pred_proba[:, 1] if y_pred_proba.shape[1] > 1 else y_pred_proba[:, 0]
                            metrics['roc_auc'] = float(roc_auc_score(y_test, probs))
                            # Calculate curves for binary
                            fpr, tpr, _ = roc_curve(y_test, probs)
                            prc, rec, _ = precision_recall_curve(y_test, probs)
                            # Downsample curves if too large to save bandwidth
                            if len(fpr) > 100:
                                idx = np.linspace(0, len(fpr)-1, 100).astype(int)
                                fpr, tpr = fpr[idx], tpr[idx]
                            if len(prc) > 100:
                                idx = np.linspace(0, len(prc)-1, 100).astype(int)
                                prc, rec = prc[idx], rec[idx]
                                
                            curve_data = {
                                "roc": {"fpr": fpr.tolist(), "tpr": tpr.tolist()},
                                "pr": {"precision": prc.tolist(), "recall": rec.tolist()}
                            }
                    except Exception as e:
                        metrics['roc_auc'] = None
                        
                    cm = confusion_matrix(y_test, y_pred)
                    cm_list = cm.tolist()
                else:
                    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
                    metrics['mae'] = float(mean_absolute_error(y_test, y_pred))
                    metrics['mse'] = float(mean_squared_error(y_test, y_pred))
                    metrics['rmse'] = float(np.sqrt(metrics['mse']))
                    metrics['r2'] = float(r2_score(y_test, y_pred))
                    
                train_time = time.time() - start_time
                
                # Class distribution for viz
                if is_classification:
                    dist_train = pd.Series(y_train).value_counts().to_dict()
                    dist_test = pd.Series(y_test).value_counts().to_dict()
                    dist_train = {f"Class {k}": int(v) for k, v in dist_train.items()}
                    dist_test = {f"Class {k}": int(v) for k, v in dist_test.items()}
                else:
                    dist_train = {}
                    dist_test = {}
                
                fold_results.append({
                    "repeat": repeat + 1,
                    "fold": fold_idx,
                    "train_size": len(X_train),
                    "test_size": len(X_test),
                    "distribution": {"train": dist_train, "test": dist_test},
                    "metrics": metrics,
                    "confusion_matrix": cm_list,
                    "curves": curve_data,
                    "training_time": train_time
                })

        # Calculate Aggregates
        agg_metrics = {}
        if fold_results:
            metric_keys = fold_results[0]["metrics"].keys()
            for key in metric_keys:
                vals = [f["metrics"][key] for f in fold_results if f["metrics"][key] is not None]
                if vals:
                    agg_metrics[key] = {
                        "mean": float(np.mean(vals)),
                        "std": float(np.std(vals)),
                        "min": float(np.min(vals)),
                        "max": float(np.max(vals))
                    }
                else:
                    agg_metrics[key] = None
        
        response_data = {
            "summary": agg_metrics,
            "folds": fold_results,
            "pipeline_used": pipeline_history,
        }
        response_data.update(req.dict())
        return response_data

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train-finalize")
def train_finalize(req: TrainELMRequest):
    """Refined endpoint to train the final model for Module 2 prediction."""
    _require_dataset()
    global last_trained_info
    
    try:
        # We assume the user wants to train on the CURRENT dataset (after preprocessing)
        # Or you can re-run the entire pipeline from original_dataset. Let's use current_dataset.
        df = current_dataset.copy()
        
        # Check target
        if req.target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{req.target_column}' not found.")
            
        # Select features
        features = req.features if req.features else [c for c in df.columns if c != req.target_column]
        features = [c for c in features if c in df.columns]
        
        # Drop rows with NAs in target or features
        df = df.dropna(subset=features + [req.target_column])
        
        X = df[features]
        y = df[req.target_column]
        
        # Scaler
        scaler = MinMaxScaler() # Using MinMax as requested for ELM
        X_scaled = scaler.fit_transform(X)
        
        # Label Encoder for classification
        le = None
        is_classification = req.problem_type == "classification"
        if is_classification:
            le = LabelEncoder()
            y = le.fit_transform(y)
            
        # Model
        if is_classification:
            model = ELMClassifier(hidden_nodes=req.hidden_nodes, activation=req.activation, random_state=req.random_seed)
        else:
            model = ELMRegressor(hidden_nodes=req.hidden_nodes, activation=req.activation, random_state=req.random_seed)
            
        model.fit(X_scaled, y)
        
        # Store for real-time prediction
        last_trained_info = {
            "model": model,
            "scaler": scaler,
            "label_encoder": le,
            "features": features,
            "target": req.target_column,
            "problem_type": req.problem_type,
            "activation": req.activation
        }
        
        return {
            "message": "Model trained and finalized for prediction.",
            "features": features,
            "target": req.target_column,
            "classes": le.classes_.tolist() if le else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict")
def predict(req: PredictRequest):
    """Real-time prediction using the last trained model."""
    if last_trained_info["model"] is None:
        raise HTTPException(status_code=404, detail="No model trained yet. Please train a model first.")
        
    try:
        # Convert input dict to df with correct feature order
        input_data = req.data
        features = last_trained_info["features"]
        
        # Check if all features exist in input
        missing = [f for f in features if f not in input_data]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing input fields: {', '.join(missing)}")
            
        # Create row
        row = np.array([[float(input_data[f]) for f in features]])
        
        # Scale
        row_scaled = last_trained_info["scaler"].transform(row)
        
        # Model prediction
        model = last_trained_info["model"]
        prediction = model.predict(row_scaled)
        
        # Convert prediction to class label if needed
        result_label = str(prediction[0])
        probabilities = {}
        
        if last_trained_info["problem_type"] == "classification":
            if last_trained_info["label_encoder"]:
                result_label = str(last_trained_info["label_encoder"].inverse_transform([prediction])[0])
                
            # Try to get probabilities for display
            try:
                # Custom prob logic for ELM
                # H = activate(X * W + b)
                # Y = H * beta
                H = model._activate(np.dot(row_scaled, model.input_weights_) + model.biases_)
                y_raw = np.dot(H, model.output_weights_)
                
                # Softmax
                exp_y = np.exp(y_raw - np.max(y_raw))
                probs = exp_y / np.sum(exp_y)
                probs = probs.flatten()
                
                classes = last_trained_info["label_encoder"].classes_
                for i, cls in enumerate(classes):
                    probabilities[str(cls)] = float(probs[i])
            except:
                pass
                
        return {
            "prediction": result_label,
            "probabilities": probabilities
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Category 3: Image Classification (ONNX Runtime) ───
# Uses MobileNetV2 ONNX model — lightweight (~14MB) and fast
onnx_session = None
imagenet_classes = None

def _load_onnx_model():
    """Lazy-load ONNX model on first request to save startup RAM."""
    global onnx_session, imagenet_classes
    if onnx_session is not None:
        return
    if not ONNX_AVAILABLE:
        return

    import urllib.request
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(model_dir, exist_ok=True)

    model_path = os.path.join(model_dir, "mobilenetv2-12.onnx")
    labels_path = os.path.join(model_dir, "imagenet_classes.json")

    # Download model if not cached
    if not os.path.exists(model_path):
        print("Downloading MobileNetV2 ONNX model (~14MB)...")
        urllib.request.urlretrieve(
            "https://github.com/onnx/models/raw/main/validated/vision/classification/mobilenet/model/mobilenetv2-12.onnx",
            model_path
        )
        print("Model downloaded.")

    # Download or create ImageNet labels
    if not os.path.exists(labels_path):
        print("Downloading ImageNet labels...")
        urllib.request.urlretrieve(
            "https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt",
            labels_path + ".txt"
        )
        with open(labels_path + ".txt", "r") as f:
            classes = [line.strip() for line in f.readlines()]
        with open(labels_path, "w") as f:
            json.dump(classes, f)
        os.remove(labels_path + ".txt")
        print("Labels downloaded.")

    with open(labels_path, "r") as f:
        imagenet_classes = json.load(f)

    onnx_session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
    print(f"ONNX model loaded: {len(imagenet_classes)} classes")


def _preprocess_image(img: Image.Image) -> np.ndarray:
    """Preprocess image for MobileNetV2: resize, normalize, NCHW format."""
    img = img.resize((224, 224))
    img_array = np.array(img).astype(np.float32) / 255.0
    # Normalize with ImageNet mean/std
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_array = (img_array - mean) / std
    # HWC -> NCHW
    img_array = np.transpose(img_array, (2, 0, 1))
    return np.expand_dims(img_array, axis=0)


@app.post("/category3/predict-image")
async def predict_image(file: UploadFile = File(...)):
    """Image Classification using ONNX Runtime (MobileNetV2)."""
    if not ONNX_AVAILABLE:
        raise HTTPException(status_code=503, detail="ONNX Runtime not installed.")

    _load_onnx_model()

    if onnx_session is None:
        raise HTTPException(status_code=503, detail="Model failed to load.")

    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')

        # Preprocess
        input_tensor = _preprocess_image(img)

        # Run inference
        input_name = onnx_session.get_inputs()[0].name
        output = onnx_session.run(None, {input_name: input_tensor})[0]

        # Softmax
        exp_scores = np.exp(output[0] - np.max(output[0]))
        probs = exp_scores / np.sum(exp_scores)

        # Top 5
        top5_idx = np.argsort(probs)[-5:][::-1]

        results = {}
        for idx in top5_idx:
            results[imagenet_classes[idx]] = float(probs[idx])

        top_class = imagenet_classes[top5_idx[0]]
        top_prob = float(probs[top5_idx[0]])

        return {
            "prediction": top_class,
            "confidence": top_prob,
            "all_scores": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
