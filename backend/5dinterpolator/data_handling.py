import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def validate_file(data, expected_shape =5):

    # If it's a DataFrame
    if isinstance(data, pd.DataFrame):
        shape = data.shape  # tuple (rows, columns)
        if shape[1] != expected_shape:
            raise ValueError(f"Uploaded DataFrame has shape {shape[1]}, expected {expected_shape}")
        # You can also check column names, data types, etc.
        return shape

    # If it's a Numpy array
    if isinstance(data, np.ndarray):
        shape = data.shape
        if shape[1] != expected_shape:
            raise ValueError(f"Uploaded array has shape {shape[1]}, expected {expected_shape}")
        return shape
    
    #If its a dictionary
    if isinstance(data, dict):
        shape = data["X"].shape
        if shape[1] != expected_shape:
            raise ValueError(f"Uploaded array has shape {shape[1]}, expected {expected_shape}")
        return shape[1]

    # Add other types as needed (e.g., lists)
    else:
        raise TypeError(f"Uploaded pickle contains unsupported type: {type(data)}")


    
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
