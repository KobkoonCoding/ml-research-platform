import pandas as pd
from sklearn.datasets import fetch_openml, load_iris, fetch_california_housing
import os

os.makedirs('sample_data', exist_ok=True)

# 1. Titanic (Classification)
print("Downloading Titanic...")
titanic = fetch_openml('titanic', version=1, as_frame=True, parser='auto')
df_titanic = titanic.frame
# Clean up slightly for better demo
df_titanic = df_titanic.drop(columns=['boat', 'body', 'home.dest'])
df_titanic.to_csv('sample_data/titanic.csv', index=False)

# 2. House Prices / California Housing (Regression)
print("Downloading House Prices...")
california = fetch_california_housing(as_frame=True)
df_cali = california.frame
df_cali.to_csv('sample_data/house_prices.csv', index=False)

# 3. Iris (Multiclass)
print("Downloading Iris...")
iris = load_iris(as_frame=True)
df_iris = iris.frame
# rename target for clarity
df_iris['target'] = df_iris['target'].map({0: 'setosa', 1: 'versicolor', 2: 'virginica'})
df_iris.rename(columns={'target': 'species'}, inplace=True)
df_iris.to_csv('sample_data/iris.csv', index=False)

print("Demo datasets saved successfully in sample_data/.")
