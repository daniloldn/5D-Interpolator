from data_handling import load_data, validate_data


def process_data(file_path: str):

    df = load_data(file_path)

    issues = []
    if df.empty:
        issues.append("data set is empty")
    if not validate_data(df):
        issues.append("data does not have the right dimension")
    if df.isna().sum().sum() > 0:
        issues.append("data has missing values")

    #add other processing steps

    return df