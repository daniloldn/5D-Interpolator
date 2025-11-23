import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def load_data(file_path: str):
    df = pd.read_pickle(file_path)
    X = df["x"]
    y = df["y"]
    validation = df["metadata"]["n_features"]
    if validation == 5:
        dim = True
    else:
        dim = False
    return X, y, dim

    
def preprocessing_x(data: pd.DataFrame):

    steps = [
        ('impute', SimpleImputer(strategy="mean", add_indicator=True)),
        ('scaler', StandardScaler())
    ]

    return Pipeline(steps)

def preprocessing_y(data:pd.DataFrame):

    steps = [
        ('scaler', StandardScaler())
    ]

    return Pipeline(steps)
