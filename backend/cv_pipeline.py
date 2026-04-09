import pandas as pd
import numpy as np

def apply_pipeline_cv(df_train: pd.DataFrame, df_test: pd.DataFrame, pipeline_history: list):
    """
    Applies the preprocessing pipeline steps incrementally to the training and testing sets.
    To prevent data leakage, fit parameters (mean, std, categories, IQR) are learned 
    STRICTLY from df_train and then used to transform both df_train and df_test.
    """
    train = df_train.copy()
    test = df_test.copy()
    
    for step in pipeline_history:
        action = step.get('action')
        params = step.get('params', {})
        
        if action == "missing":
            train, test = _cv_missing(train, test, params)
        elif action == "outliers":
            # Fit IQR/Z-score limits on train, cap/remove on train, cap only on test
            train, test = _cv_outliers(train, test, params)
        elif action == "encoding":
            train, test = _cv_encoding(train, test, params)
        elif action == "scaling":
            # Fit scaler on train, transform both
            train, test = _cv_scaling(train, test, params)
        elif action == "imbalance":
            # Smote / Resampling is STRICTLY only for the training set!
            import preprocessing
            target_col = params.get("target_column")
            method = params.get("method")
            if target_col and target_col in train.columns:
                train = preprocessing.solve_imbalance(train, target_col, method)
        elif action == "feature_selection":
            # Fit feature selector on train, transform both
            train, test = _cv_feature_selection(train, test, params)

    return train, test


def _cv_missing(train, test, params):
    strategy = params.get("strategy", "mean")
    cols = params.get("columns")
    if not cols:
        cols = list(train.columns)
        
    for c in cols:
        if c not in train.columns:
            continue
            
        if strategy == "drop":
            # Finding rows with nulls in train
            bad_indices = train[train[c].isnull()].index
            train = train.drop(index=bad_indices)
            # For Test, we drop rows too if that's the strategy (Standard practice in many competitions)
            bad_test_indices = test[test[c].isnull()].index
            test = test.drop(index=bad_test_indices)
            
        elif strategy == "drop_cols":
            if train[c].isnull().any():
                train = train.drop(columns=[c])
                if c in test.columns:
                    test = test.drop(columns=[c])
                    
        else:
            # Imputation strategies
            is_numeric = pd.api.types.is_numeric_dtype(train[c])
            fill_val = None
            
            if not is_numeric:
                # LEARN mode only from train
                m = train[c].mode()
                fill_val = m.iat[0] if not m.empty else "Missing"
            else:
                if strategy == "mean":
                    fill_val = train[c].mean()
                elif strategy == "median":
                    fill_val = train[c].median()
                elif strategy == "mode":
                    m = train[c].mode()
                    fill_val = m.iat[0] if not m.empty else 0
                elif strategy == "constant":
                    fill_val = params.get("value", 0)

            # APPLY to both
            if fill_val is not None:
                train[c] = train[c].fillna(fill_val)
                test[c] = test[c].fillna(fill_val)
                
    return train, test


def _cv_outliers(train, test, params):
    method = params.get("method", "iqr")
    treatment = params.get("treatment", "remove")
    threshold = float(params.get("threshold", 1.5))
    cols = params.get("columns")
    if cols is None:
        cols = list(train.select_dtypes(include=[np.number]).columns)
    
    for col in cols:
        if col not in train.columns or not np.issubdtype(train[col].dtype, np.number):
            continue
            
        # 1. Learn limits ONLY from train
        if method == "iqr":
            q1 = train[col].quantile(0.25)
            q3 = train[col].quantile(0.75)
            iqr = q3 - q1
            lower = q1 - threshold * iqr
            upper = q3 + threshold * iqr
        else: # zscore
            mean = train[col].mean()
            std = train[col].std()
            lower = mean - threshold * std
            upper = mean + threshold * std
            
        # 2. Transform train and test
        if treatment == "remove":
            train = train[(train[col] >= lower) & (train[col] <= upper) | train[col].isna()]
            # Test should generally NOT lose instances! We'll cap them instead to avoid model shock.
            test[col] = test[col].clip(lower=lower, upper=upper)
        elif treatment == "cap":
            train[col] = train[col].clip(lower=lower, upper=upper)
            test[col] = test[col].clip(lower=lower, upper=upper) 
        elif treatment == "null":
            train.loc[(train[col] < lower) | (train[col] > upper), col] = np.nan
            test.loc[(test[col] < lower) | (test[col] > upper), col] = np.nan
            
    return train, test


def _cv_encoding(train, test, params):
    col = params.get("column")
    method = params.get("method", "label")
    if col not in train.columns:
        return train, test
        
    if method in ["label", "ordinal"]:
        # Learn categories from Train
        cats = train[col].astype('category').cat.categories
        train[col] = pd.Categorical(train[col], categories=cats).codes
        # Test transforms unknown categories to -1 automatically when using codes
        test[col] = pd.Categorical(test[col], categories=cats).codes
    elif method == "onehot":
        # 1. Learn unique categories from Train
        unique_cats = train[col].unique()
        
        # 2. Add dummies for Train
        train_dummies = pd.get_dummies(train[col], prefix=col)
        train = pd.concat([train.drop(columns=[col]), train_dummies], axis=1)
        
        # 3. Add dummies for Test
        test_dummies = pd.get_dummies(test[col], prefix=col)
        test = pd.concat([test.drop(columns=[col]), test_dummies], axis=1)
        
        # 4. Aligner (Ensure Test has exact same columns as Train)
        # Drop columns in Test that weren't in Train
        # Add columns in Test that were in Train but are missing in Test (as 0)
        expected_cols = [c for c in train.columns if c.startswith(f"{col}_")]
        for c in expected_cols:
            if c not in test.columns:
                test[c] = 0
        
        # Drop any categories found in test but not train
        extra_cols = [c for c in test.columns if c.startswith(f"{col}_") and c not in train.columns]
        if extra_cols:
            test = test.drop(columns=extra_cols)
            
    return train, test


def _cv_scaling(train, test, params):
    cols = params.get("columns")
    method = params.get("method", "standard")
    if cols is None:
        cols = list(train.select_dtypes(include=[np.number]).columns)
    
    cols = [c for c in cols if c in train.columns and np.issubdtype(train[c].dtype, np.number)]
    
    for col in cols:
        if method == "standard":
            mean = train[col].mean()
            std = train[col].std()
            if std > 0:
                train[col] = (train[col] - mean) / std
                test[col] = (test[col] - mean) / std
        elif method == "minmax":
            mn = train[col].min()
            mx = train[col].max()
            if mx - mn > 0:
                train[col] = (train[col] - mn) / (mx - mn)
                test[col] = (test[col] - mn) / (mx - mn)
        elif method == "robust":
            med = train[col].median()
            q1 = train[col].quantile(0.25)
            q3 = train[col].quantile(0.75)
            iqr = q3 - q1
            if iqr > 0:
                train[col] = (train[col] - med) / iqr
                test[col] = (test[col] - med) / iqr
        elif method == "log":
            if (train[col].dropna() > 0).all():
                train[col] = np.log(train[col])
                test[col] = np.log(test[col].clip(lower=1e-8)) # Protect test against log(0) 
            elif (train[col].dropna() >= 0).all():
                train[col] = np.log1p(train[col])
                test[col] = np.log1p(test[col].clip(lower=0)) # Protect test
        elif method == "sqrt":
            if (train[col].dropna() >= 0).all():
                train[col] = np.sqrt(train[col])
                test[col] = np.sqrt(test[col].clip(lower=0)) # Protect test
                
    return train, test


def _cv_feature_selection(train, test, params):
    method = params.get("method", "variance")
    threshold = float(params.get("threshold", 0.0))
    target_col = params.get("target_column")
    
    numeric_cols = list(train.select_dtypes(include=[np.number]).columns)
    
    if method == "variance":
        from sklearn.feature_selection import VarianceThreshold
        vt = VarianceThreshold(threshold=threshold)
        X_train = train[numeric_cols].fillna(train[numeric_cols].mean()).fillna(0)
        vt.fit(X_train)
        cols_to_keep = [numeric_cols[i] for i in range(len(numeric_cols)) if vt.variances_[i] > threshold]
        cols_to_drop = [c for c in numeric_cols if c not in cols_to_keep]
        if target_col and target_col in cols_to_drop:
            cols_to_drop.remove(target_col)
        if cols_to_drop:
            train = train.drop(columns=cols_to_drop)
            test = test.drop(columns=[c for c in cols_to_drop if c in test.columns])
            
    elif method == "correlation":
        corr = train[numeric_cols].corr().abs()
        upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
        to_drop = [column for column in upper.columns if any(upper[column] > threshold)]
        if target_col and target_col in to_drop:
            to_drop.remove(target_col)
        if to_drop:
            train = train.drop(columns=to_drop)
            test = test.drop(columns=[c for c in to_drop if c in test.columns])
            
    return train, test
