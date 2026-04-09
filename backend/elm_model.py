import numpy as np
from scipy.linalg import pinv
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.preprocessing import LabelBinarizer

class ELMClassifier(BaseEstimator, ClassifierMixin):
    """
    Extreme Learning Machine (ELM) Classifier
    A single-hidden layer feedforward neural network (SLFN) where the input weights 
    and biases are randomly generated and the output weights are solved analytically.
    """
    def __init__(self, hidden_nodes=100, activation='sigmoid', random_state=None):
        self.hidden_nodes = hidden_nodes
        self.activation = activation
        self.random_state = random_state
        self.input_weights_ = None
        self.biases_ = None
        self.output_weights_ = None
        self.classes_ = None
        self.label_binarizer_ =LabelBinarizer()

    def _activate(self, x):
        if self.activation == 'sigmoid':
            # to prevent overflow
            return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
        elif self.activation == 'relu':
            return np.maximum(0, x)
        elif self.activation == 'tanh':
            return np.tanh(x)
        else:
            raise ValueError(f"Unknown activation function '{self.activation}'")

    def fit(self, X, y):
        # Convert inputs if they are dataframes
        if hasattr(X, 'values'):
            X = X.values
        if hasattr(y, 'values'):
            y = y.values
            
        # Ensure numerical types
        X = X.astype(np.float64)
            
        rng = np.random.RandomState(self.random_state)
        n_samples, n_features = X.shape

        # Handle class labels (one-hot encoding for the targets)
        self.classes_ = np.unique(y)
        y_bin = self.label_binarizer_.fit_transform(y)
        
        # If binary classification, LabelBinarizer returns a 1D column.
        # Ensure it has two columns for the pseudo-inverse logic to easily map to outputs.
        if y_bin.shape[1] == 1:
            y_bin = np.hstack((1 - y_bin, y_bin))

        # Randomly generate input weights and biases
        self.input_weights_ = rng.randn(n_features, self.hidden_nodes)
        self.biases_ = rng.randn(self.hidden_nodes)

        # Calculate hidden layer output matrix H
        H = self._activate(np.dot(X, self.input_weights_) + self.biases_)

        # Calculate output weights using Moore-Penrose pseudoinverse
        # W_out = pinv(H) * Y
        self.output_weights_ = np.dot(pinv(H), y_bin)

        return self

    def predict(self, X):
        if self.input_weights_ is None:
            raise Exception("Model is not fitted yet.")
            
        if hasattr(X, 'values'):
            X = X.values
        X = X.astype(np.float64)

        # Calculate hidden layer output W
        H = self._activate(np.dot(X, self.input_weights_) + self.biases_)

        # Calculate outputs W_out
        y_pred_raw = np.dot(H, self.output_weights_)
        
        # Determine predicted classes
        if y_pred_raw.shape[1] == 2 and len(self.classes_) == 2:
            # Binary classification structure handling
            y_pred_idx = np.argmax(y_pred_raw, axis=1)
            y_pred = self.classes_[y_pred_idx]
        else:
            y_pred_bin = np.zeros_like(y_pred_raw)
            y_pred_bin[np.arange(len(y_pred_raw)), y_pred_raw.argmax(1)] = 1
            y_pred = self.label_binarizer_.inverse_transform(y_pred_bin)

        return y_pred

class ELMRegressor(BaseEstimator):
    """
    Extreme Learning Machine (ELM) Regressor
    A single-hidden layer feedforward neural network (SLFN) for regression.
    """
    def __init__(self, hidden_nodes=100, activation='sigmoid', random_state=None):
        self.hidden_nodes = hidden_nodes
        self.activation = activation
        self.random_state = random_state
        self.input_weights_ = None
        self.biases_ = None
        self.output_weights_ = None

    def _activate(self, x):
        if self.activation == 'sigmoid':
            return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
        elif self.activation == 'relu':
            return np.maximum(0, x)
        elif self.activation == 'tanh':
            return np.tanh(x)
        else:
            raise ValueError(f"Unknown activation function '{self.activation}'")

    def fit(self, X, y):
        # Convert inputs if they are dataframes
        if hasattr(X, 'values'):
            X = X.values
        if hasattr(y, 'values'):
            y = y.values
            
        # Ensure numerical types
        X = X.astype(np.float64)
        y = y.astype(np.float64).reshape(-1, 1) if len(y.shape) == 1 else y.astype(np.float64)
            
        rng = np.random.RandomState(self.random_state)
        n_samples, n_features = X.shape

        # Randomly generate input weights and biases
        self.input_weights_ = rng.randn(n_features, self.hidden_nodes)
        self.biases_ = rng.randn(self.hidden_nodes)

        # Calculate hidden layer output matrix H
        H = self._activate(np.dot(X, self.input_weights_) + self.biases_)

        # Calculate output weights using Moore-Penrose pseudoinverse
        self.output_weights_ = np.dot(pinv(H), y)

        return self

    def predict(self, X):
        if self.input_weights_ is None:
            raise Exception("Model is not fitted yet.")
            
        if hasattr(X, 'values'):
            X = X.values
        X = X.astype(np.float64)

        # Calculate hidden layer output W
        H = self._activate(np.dot(X, self.input_weights_) + self.biases_)

        # Calculate outputs W_out
        y_pred = np.dot(H, self.output_weights_)
        
        # Flatten if originally 1D
        if y_pred.shape[1] == 1:
            y_pred = y_pred.flatten()

        return y_pred
