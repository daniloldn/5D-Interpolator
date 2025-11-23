import pandas as pd


def load_data(file_path: str):
    return pd.read_pickle(file_path)