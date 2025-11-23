import pandas as pd
from sklearn.impute import SimpleImputer


def load_data(file_path: str):
    return pd.read_pickle(file_path)

def validate_data(data: pd.DataFrame):
    shape = data.shape
    if shape[1] ==6:
        return True
    else:
        return False
    
def impute(data):
    imputer = SimpleImputer(strategy="mean", add_indicator=True)
    imputer.fit(data)
    return imputer.transform(data)
    
def missing_values(data: pd.DataFrame):
    missing_num  = data.isna().sum().sum()

    if missing_num == 0:
        return data
    
    if missing_num <= (0.1*data.shape[0]):
        return data.dropna()

    else:
        return impute(data)