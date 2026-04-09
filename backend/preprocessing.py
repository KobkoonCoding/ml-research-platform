import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTE, RandomOverSampler
from imblearn.under_sampling import RandomUnderSampler
from imblearn.combine import SMOTEENN
from sklearn.feature_selection import VarianceThreshold, SelectKBest, f_classif, f_regression, mutual_info_classif, mutual_info_regression
from sklearn.model_selection import train_test_split
from scipy import stats
import sys
def analyze_dataset(df: pd.DataFrame):
    """Returns comprehensive analysis of the dataset for EDA dashboard."""
    
    # Column type classification
    numeric_cols = list(df.select_dtypes(include=[np.number]).columns)
    categorical_cols = list(df.select_dtypes(include=['object', 'category']).columns)
    datetime_cols = list(df.select_dtypes(include=['datetime', 'datetimetz']).columns)
    boolean_cols = list(df.select_dtypes(include=['bool']).columns)
    
    # Preview data (first 100 rows)
    preview_df = df.head(100).copy()
    # Convert any non-serializable types
    for col in preview_df.columns:
        if preview_df[col].dtype == 'object':
            preview_df[col] = preview_df[col].astype(str)
        elif pd.api.types.is_datetime64_any_dtype(preview_df[col]):
            preview_df[col] = preview_df[col].astype(str)
    
    # Replace all np.nan with None for JSON serialization
    preview_df = preview_df.replace({np.nan: None})
    preview_data = preview_df.to_dict(orient='records')
    
    # Missing values
    missing_per_col = df.isnull().sum().to_dict()
    missing_pct_per_col = (df.isnull().sum() / len(df) * 100).round(2).to_dict()
    total_missing = int(df.isnull().sum().sum())
    total_missing_pct = round(total_missing / (df.shape[0] * df.shape[1]) * 100, 2) if df.shape[0] * df.shape[1] > 0 else 0
    
    # Duplicate rows
    duplicate_count = int(df.duplicated().sum())
    
    # Memory usage
    memory_bytes = int(df.memory_usage(deep=True).sum())
    if memory_bytes > 1024 * 1024:
        memory_str = f"{memory_bytes / (1024*1024):.2f} MB"
    else:
        memory_str = f"{memory_bytes / 1024:.2f} KB"
    
    # Distributions for categorical columns (bar charts)
    distributions = {}
    for col in df.columns:
        nunique = df[col].nunique(dropna=True)
        if nunique <= 30 and nunique > 0:
            counts = df[col].value_counts(dropna=False).head(30)
            items = []
            for k, v in counts.items():
                label = 'Missing/NaN' if pd.isna(k) else str(k)
                items.append({"name": label, "count": int(v)})
            distributions[col] = items
    
    # Histogram data for numeric columns
    histograms = {}
    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) > 0:
            try:
                counts_arr, bin_edges = np.histogram(col_data, bins=min(30, max(10, len(col_data)//10)))
                histograms[col] = {
                    "counts": counts_arr.tolist(),
                    "bin_edges": bin_edges.tolist()
                }
            except Exception:
                pass
    
    # Box plot data for numeric columns
    boxplots = {}
    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) > 0:
            try:
                q1 = float(col_data.quantile(0.25))
                q2 = float(col_data.quantile(0.5))
                q3 = float(col_data.quantile(0.75))
                iqr = q3 - q1
                whisker_low = float(col_data[col_data >= q1 - 1.5 * iqr].min())
                whisker_high = float(col_data[col_data <= q3 + 1.5 * iqr].max())
                outliers = col_data[(col_data < q1 - 1.5 * iqr) | (col_data > q3 + 1.5 * iqr)].tolist()
                boxplots[col] = {
                    "q1": q1, "median": q2, "q3": q3,
                    "whisker_low": whisker_low, "whisker_high": whisker_high,
                    "outliers": outliers[:100],  # limit outliers for payload
                    "outlier_count": len(outliers),
                    "mean": float(col_data.mean()),
                    "std": float(col_data.std())
                }
            except Exception:
                pass
    
    # Correlation matrix for numeric columns
    correlation = {}
    if len(numeric_cols) >= 2:
        try:
            corr_matrix = df[numeric_cols].corr()
            correlation = {
                "columns": list(corr_matrix.columns),
                "values": corr_matrix.fillna(0).values.tolist()
            }
        except Exception:
            pass
    
    # Data quality insights
    insights = []
    
    # Missing value insights
    cols_with_missing = {col: cnt for col, cnt in missing_per_col.items() if cnt > 0}
    if cols_with_missing:
        high_missing = [col for col, cnt in cols_with_missing.items() if cnt / len(df) > 0.3]
        insights.append({
            "type": "warning",
            "title": f"Missing Values Detected ({len(cols_with_missing)} columns)",
            "detail": f"Total {total_missing} missing values across the dataset ({total_missing_pct}%)."
        })
        if high_missing:
            insights.append({
                "type": "danger",
                "title": f"High Missing Rate (>30%)",
                "detail": f"Columns with >30% missing: {', '.join(high_missing)}. Consider dropping or imputing."
            })
    else:
        insights.append({
            "type": "success",
            "title": "No Missing Values",
            "detail": "The dataset has no missing values."
        })
    
    # Duplicate insights
    if duplicate_count > 0:
        insights.append({
            "type": "warning",
            "title": f"{duplicate_count} Duplicate Rows Found",
            "detail": f"{duplicate_count} duplicate rows detected ({duplicate_count/len(df)*100:.1f}% of dataset)."
        })
    
    # Skewness insights for numeric columns
    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) > 10:
            try:
                skew_val = float(col_data.skew())
                if abs(skew_val) > 2:
                    insights.append({
                        "type": "info",
                        "title": f"Highly Skewed: {col}",
                        "detail": f"Skewness = {skew_val:.2f}. Consider log/sqrt transform."
                    })
            except Exception:
                pass
    
    # Near-zero variance
    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) > 1:
            try:
                if col_data.std() < 1e-10:
                    insights.append({
                        "type": "info",
                        "title": f"Near-Zero Variance: {col}",
                        "detail": f"Column '{col}' has near-zero variance. May not be useful for modeling."
                    })
            except Exception:
                pass
    
    # High cardinality categorical
    for col in categorical_cols:
        nunique = df[col].nunique()
        if nunique > 50:
            insights.append({
                "type": "info",
                "title": f"High Cardinality: {col}",
                "detail": f"Column '{col}' has {nunique} unique values. One-hot encoding may be expensive."
            })
    
    # Class imbalance check (for potential target columns with small unique count)
    for col in df.columns:
        nunique = df[col].nunique(dropna=True)
        if 2 <= nunique <= 10:
            counts = df[col].value_counts()
            ratio = counts.min() / counts.max()
            if ratio < 0.3:
                insights.append({
                    "type": "warning",
                    "title": f"Potential Class Imbalance: {col}",
                    "detail": f"Minority/majority ratio = {ratio:.2f}. Consider resampling if this is your target."
                })
    
    # Summary statistics
    summary_stats = {}
    desc = df.describe(include='all')
    for col in df.columns:
        col_stats = {}
        if col in desc.columns:
            for stat_name in desc.index:
                val = desc.at[stat_name, col]
                if pd.isna(val):
                    col_stats[stat_name] = None
                elif isinstance(val, (np.integer, np.floating)):
                    col_stats[stat_name] = float(val)
                else:
                    col_stats[stat_name] = str(val)
        summary_stats[col] = col_stats

    # V2 EDA: Missing Pattern Matrix (downsampled for heatmap)
    max_missing_heat_rows = 500
    missing_sample_df = df.sample(n=min(len(df), max_missing_heat_rows), random_state=42) if len(df) > max_missing_heat_rows else df
    missing_matrix = missing_sample_df.isnull().values.astype(int).tolist()
    
    # V2 EDA: Downsampled numeric data for Pair / Violin plots
    max_numeric_rows = 500
    numeric_sample_df = df[numeric_cols].copy()
    if len(numeric_sample_df) > max_numeric_rows:
        numeric_sample_df = numeric_sample_df.sample(n=max_numeric_rows, random_state=42)
        
    numeric_sample = {}
    for col in numeric_sample_df.columns:
        numeric_sample[col] = [None if pd.isna(x) else float(x) for x in numeric_sample_df[col].tolist()]

    analysis = {
        "shape": list(df.shape),
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "column_types": {
            "numeric": numeric_cols,
            "categorical": categorical_cols,
            "datetime": datetime_cols,
            "boolean": boolean_cols,
        },
        "missing_values": missing_per_col,
        "missing_pct": missing_pct_per_col,
        "total_missing": total_missing,
        "total_missing_pct": total_missing_pct,
        "duplicate_count": duplicate_count,
        "memory_usage": memory_str,
        "preview_data": preview_data,
        "distributions": distributions,
        "histograms": histograms,
        "boxplots": boxplots,
        "correlation": correlation,
        "insights": insights,
        "summary_statistics": summary_stats,
        "missing_matrix": missing_matrix,
        "missing_matrix_columns": list(df.columns),
        "numeric_sample": numeric_sample,
    }
    return analysis


def preprocess_missing_values(df: pd.DataFrame, strategy: str = "mean", columns=None):
    """Handle missing values. Supports: drop, drop_cols, mean, median, mode, constant."""
    processed_df = df.copy()
    target_cols = columns if (columns and len(columns) > 0) else list(processed_df.columns)

    if strategy == "drop":
        processed_df = processed_df.dropna(subset=target_cols)
    elif strategy == "drop_cols":
        cols_to_drop = [c for c in target_cols if c in processed_df.columns and processed_df[c].isnull().any()]
        processed_df = processed_df.drop(columns=cols_to_drop)
    else:
        for col in target_cols:
            if col not in processed_df.columns:
                continue
            
            if processed_df[col].isnull().any():
                is_numeric = pd.api.types.is_numeric_dtype(processed_df[col])
                
                fill_val = None
                if not is_numeric:
                    # Non-numeric always uses mode
                    m = processed_df[col].mode()
                    fill_val = m.iat[0] if not m.empty else "Missing"
                else:
                    if strategy == "mean":
                        fill_val = processed_df[col].mean()
                    elif strategy == "median":
                        fill_val = processed_df[col].median()
                    elif strategy == "mode":
                        m = processed_df[col].mode()
                        fill_val = m.iat[0] if not m.empty else 0
                    elif strategy == "constant":
                        fill_val = 0
                
                if fill_val is not None:
                    processed_df[col] = processed_df[col].fillna(fill_val)
                else:
                    # Final fallback
                    processed_df[col] = processed_df[col].fillna(0 if is_numeric else "Missing")
                    
    return processed_df


def handle_duplicates(df: pd.DataFrame, keep: str = "first"):
    """Handle duplicate rows. keep: first, last, or false (remove all)."""
    if keep == "false":
        return df.drop_duplicates(keep=False)
    return df.drop_duplicates(keep=keep)


def remove_outliers(df: pd.DataFrame, method: str = "iqr", threshold: float = 1.5,
                    treatment: str = "remove", columns=None):
    """Handle outliers: remove rows, or cap/floor values."""
    processed = df.copy()
    numeric_cols = columns if columns else list(df.select_dtypes(include=[np.number]).columns)
    numeric_cols = [c for c in numeric_cols if c in processed.columns and np.issubdtype(processed[c].dtype, np.number)]

    if len(numeric_cols) == 0:
        return processed

    if method == "zscore":
        for col in numeric_cols:
            col_data = processed[col].dropna()
            if len(col_data) < 3:
                continue
            z = np.abs(stats.zscore(col_data))
            outlier_idx = col_data.index[z >= threshold]
            if treatment == "remove":
                processed = processed.drop(index=outlier_idx)
            elif treatment == "cap":
                mean, std = col_data.mean(), col_data.std()
                lower, upper = mean - threshold * std, mean + threshold * std
                processed[col] = processed[col].clip(lower, upper)
            elif treatment == "null":
                processed.loc[outlier_idx, col] = np.nan
    elif method == "iqr":
        for col in numeric_cols:
            col_data = processed[col].dropna()
            if len(col_data) < 4:
                continue
            Q1, Q3 = col_data.quantile(0.25), col_data.quantile(0.75)
            IQR = Q3 - Q1
            lower, upper = Q1 - threshold * IQR, Q3 + threshold * IQR
            outlier_mask = (processed[col] < lower) | (processed[col] > upper)
            if treatment == "remove":
                processed = processed[~outlier_mask | processed[col].isna()]
            elif treatment == "cap":
                processed[col] = processed[col].clip(lower, upper)
            elif treatment == "null":
                processed.loc[outlier_mask, col] = np.nan

    return processed.reset_index(drop=True)


def clean_data_types(df: pd.DataFrame, column: str, sub_action: str = "trim"):
    """Clean data types for a specific column."""
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found.")

    processed = df.copy()

    if sub_action == "trim":
        if processed[column].dtype == 'object':
            processed[column] = processed[column].str.strip()
    elif sub_action == "lowercase":
        if processed[column].dtype == 'object':
            processed[column] = processed[column].str.lower()
    elif sub_action == "uppercase":
        if processed[column].dtype == 'object':
            processed[column] = processed[column].str.upper()
    elif sub_action == "to_numeric":
        processed[column] = pd.to_numeric(processed[column], errors='coerce')
    elif sub_action == "to_datetime":
        processed[column] = pd.to_datetime(processed[column], errors='coerce')
    elif sub_action == "remove_special":
        if processed[column].dtype == 'object':
            processed[column] = processed[column].str.replace(r'[^a-zA-Z0-9\s]', '', regex=True)

    return processed


def encode_categorical(df: pd.DataFrame, column: str, method: str = "label", target_column: str = None):
    """Encode a categorical column. Methods: label, onehot, ordinal, frequency, target."""
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found.")

    processed = df.copy()

    if method == "label":
        processed[column] = processed[column].astype('category').cat.codes
    elif method == "onehot":
        dummies = pd.get_dummies(processed[column], prefix=column, drop_first=False)
        processed = pd.concat([processed.drop(columns=[column]), dummies], axis=1)
    elif method == "ordinal":
        # Same as label for now; user-defined order would need a UI parameter
        processed[column] = processed[column].astype('category').cat.codes
    elif method == "frequency":
        freq = processed[column].value_counts(normalize=True).to_dict()
        processed[column] = processed[column].map(freq)
    elif method == "target":
        if not target_column or target_column not in processed.columns:
            raise ValueError("Target encoding requires a selected target column.")
        
        target_series = processed[target_column]
        if not pd.api.types.is_numeric_dtype(target_series):
            target_series = target_series.astype('category').cat.codes
            
        target_mean = target_series.groupby(processed[column]).mean()
        processed[column] = processed[column].map(target_mean).fillna(target_series.mean())

    return processed


def scale_features(df: pd.DataFrame, columns, method: str = "standard"):
    """Scale numeric columns. Methods: standard, minmax, robust, log, sqrt."""
    processed = df.copy()
    if columns is None:
        columns = list(df.select_dtypes(include=[np.number]).columns)
    columns = [c for c in columns if c in processed.columns and np.issubdtype(processed[c].dtype, np.number)]

    if method == "standard":
        for col in columns:
            mean = processed[col].mean()
            std = processed[col].std()
            if std > 0:
                processed[col] = (processed[col] - mean) / std
    elif method == "minmax":
        for col in columns:
            mn = processed[col].min()
            mx = processed[col].max()
            if mx - mn > 0:
                processed[col] = (processed[col] - mn) / (mx - mn)
    elif method == "robust":
        for col in columns:
            med = processed[col].median()
            Q1 = processed[col].quantile(0.25)
            Q3 = processed[col].quantile(0.75)
            iqr = Q3 - Q1
            if iqr > 0:
                processed[col] = (processed[col] - med) / iqr
    elif method == "log":
        for col in columns:
            if (processed[col].dropna() > 0).all():
                processed[col] = np.log(processed[col])
            else:
                # log1p for columns with zeros
                if (processed[col].dropna() >= 0).all():
                    processed[col] = np.log1p(processed[col])
                else:
                    raise ValueError(f"Cannot apply log transform on column '{col}' with negative values.")
    elif method == "sqrt":
        for col in columns:
            if (processed[col].dropna() >= 0).all():
                processed[col] = np.sqrt(processed[col])
            else:
                raise ValueError(f"Cannot apply sqrt transform on column '{col}' with negative values.")
    elif method == "boxcox":
        for col in columns:
            if (processed[col].dropna() > 0).all():
                processed[col] = processed[col].copy()
                processed.loc[processed[col].notnull(), col], _ = stats.boxcox(processed[col].dropna())
            else:
                raise ValueError(f"Box-Cox transform requires strictly positive values (column '{col}' fails).")
    elif method == "yeojohnson":
        for col in columns:
            processed[col] = processed[col].copy()
            processed.loc[processed[col].notnull(), col], _ = stats.yeojohnson(processed[col].dropna())

    return processed


def solve_imbalance(df: pd.DataFrame, target_col: str, method: str = "smote"):
    """Handle imbalanced dataset using specified method."""
    if target_col not in df.columns:
        raise ValueError(f"Target column {target_col} not found in dataset.")

    current_counts = df[target_col].value_counts()
    if len(current_counts) < 2:
        return df

    X = df.drop(columns=[target_col])
    y = df[target_col]

    X_numeric = X.copy()
    for col in X_numeric.select_dtypes(include=['object', 'category']).columns:
        X_numeric[col] = X_numeric[col].astype('category').cat.codes

    if X_numeric.isnull().any().any():
        raise ValueError(f"Cannot apply {method}. Please handle missing values first.")

    if method == "smote":
        sampler = SMOTE(random_state=42)
    elif method == "random_over":
        sampler = RandomOverSampler(random_state=42)
    elif method == "random_under":
        sampler = RandomUnderSampler(random_state=42)
    elif method == "smote_enn":
        sampler = SMOTEENN(random_state=42)
    else:
        raise ValueError(f"Unknown imbalance method: {method}")

    try:
        X_resampled, y_resampled = sampler.fit_resample(X_numeric, y)
    except ValueError as e:
        raise ValueError(f"Imbalance sampling failed. Minority class may be too small. Details: {str(e)}")

    resampled_df = pd.DataFrame(X_resampled, columns=X.columns)
    resampled_df[target_col] = y_resampled
    return resampled_df

def feature_selection(df: pd.DataFrame, method: str = "variance", threshold: float = 0.0, target_col: str = None, k: int = 10):
    """Select features using variance threshold, correlation, select k-best, or mutual info."""
    processed = df.copy()
    numeric_cols = list(processed.select_dtypes(include=[np.number]).columns)
    
    if len(numeric_cols) == 0:
        return processed

    if method == "variance":
        var_threshold = VarianceThreshold(threshold=threshold)
        X = processed[numeric_cols]
        X_filled = X.fillna(X.mean()).fillna(0)
        var_threshold.fit(X_filled)
        cols_to_keep = [numeric_cols[i] for i in range(len(numeric_cols)) if var_threshold.variances_[i] > threshold]
        cols_to_drop = [c for c in numeric_cols if c not in cols_to_keep]
        if target_col and target_col in cols_to_drop:
            cols_to_drop.remove(target_col)
        if cols_to_drop:
            processed = processed.drop(columns=cols_to_drop)

    elif method == "correlation":
        corr_matrix = processed[numeric_cols].corr().abs()
        upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
        to_drop = [column for column in upper.columns if any(upper[column] > threshold)]
        if target_col and target_col in to_drop:
            to_drop.remove(target_col)
        if to_drop:
            processed = processed.drop(columns=to_drop)
            
    elif method in ["kbest", "mutual_info"]:
        if not target_col or target_col not in processed.columns:
            raise ValueError(f"{method} requires a target column.")
            
        X = processed[numeric_cols]
        if target_col in X.columns:
            X = X.drop(columns=[target_col])
            
        if X.shape[1] == 0:
            return processed
            
        X_filled = X.fillna(X.mean()).fillna(0)
        y = processed[target_col]
        
        is_classification = not pd.api.types.is_numeric_dtype(y) or y.nunique() <= 20
        y_encoded = y.astype('category').cat.codes if is_classification else y
        
        actual_k = min(k, X.shape[1])
        
        if method == "kbest":
            score_func = f_classif if is_classification else f_regression
        else:
            score_func = mutual_info_classif if is_classification else mutual_info_regression
            
        selector = SelectKBest(score_func=score_func, k=actual_k)
        selector.fit(X_filled, y_encoded)
        
        cols_to_keep = X.columns[selector.get_support()].tolist()
        cols_to_drop = [c for c in X.columns if c not in cols_to_keep]
        if cols_to_drop:
            processed = processed.drop(columns=cols_to_drop)

    return processed

def split_dataset(df: pd.DataFrame, test_size: float = 0.2, stratify_col: str = None, random_state: int = 42, split_name: str = "_split_"):
    """Split dataset into Train and Test, appending a new _split_ column."""
    processed = df.copy()
    
    stratify_data = None
    if stratify_col and stratify_col in processed.columns:
        stratify_data = processed[stratify_col]

    try:
        train_idx, test_idx = train_test_split(
            processed.index, 
            test_size=test_size, 
            random_state=random_state, 
            stratify=stratify_data
        )
    except ValueError as e:
        raise ValueError(f"Failed to split dataset. Adjust ratio or check class counts if stratifying. Error: {str(e)}")

    processed[split_name] = "Train"
    processed.loc[test_idx, split_name] = "Test"
    return processed

def drop_columns(df: pd.DataFrame, columns: list):
    """Drop specified columns from the dataset."""
    if not columns:
        return df
    
    # Filter to avoid KeyError if column doesn't exist
    cols_to_drop = [c for c in columns if c in df.columns]
    return df.drop(columns=cols_to_drop)
