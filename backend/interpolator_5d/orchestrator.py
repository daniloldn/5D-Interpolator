import os, uuid
import pickle

from data_handling import validate_file, preprocessing_x
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


processed_dir = "data/processed"

os.makedirs(processed_dir, exist_ok=True)

def process_data(file_path: str):
    basename = os.path.basename(file_path)
    processed_path = os.path.join(processed_dir, basename.replace(".pkl", "_processed.pkl"))

    #loading the data
    with open(file_path, "rb") as f:

        #processing data
        data_dict = pickle.load(f)
        X = data_dict["X"]
        y = data_dict["y"]

        #validate data
        try:
            shape = validate_file(X)
            print(f"Valid file with {shape} featuers:")

            X_transformed = preprocessing_x.fit_transform(X)
            scaler_y = StandardScaler()
            y_scaled = scaler_y.fit_transform(y.reshape(-1, 1)).flatten()

             # Split
            X_train, X_test, y_train, y_test = train_test_split(
            X_transformed, y, test_size=0.2, random_state=42
                )

            # Save splits as dict
            split_dict = {
                "X_train": X_train,
                "X_test": X_test,
                "y_train": y_train,
                "y_test": y_test
                }



            with open(processed_path, "wb") as pf:
                pickle.dump(split_dict, pf)
            print(f"Processed and split data saved to: {processed_path}")
            return processed_path

        except Exception as e:
            print("Validation failed:", e)
            return None