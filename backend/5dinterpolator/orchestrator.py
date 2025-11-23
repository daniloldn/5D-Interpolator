from data_handling import load_data, preprocessing_x, preprocessing_y
from sklearn.model_selection import train_test_split


def process_data(file_path: str):

    X, y, dim = load_data(file_path)

    issues = []
    if not dim:
        issues.append("The data has wrong dimensions")
    if X.shape[0] != y.shape[0]:
        issues.append("Features and target don't match dimensions")
    if X.shape[0] == 0:
        issues.append("Data set is empyt")
    
    #standardize and impute if needed (X only)
    y_transform = preprocessing_y.transfrom(y)
    X_transform = preprocessing_x.transform(X)

    #train test split

    X_train, X_test, y_train, y_test = train_test_split(X_transform, y_transform, test_size=0.2)

    return X_train, X_test, y_train, y_test