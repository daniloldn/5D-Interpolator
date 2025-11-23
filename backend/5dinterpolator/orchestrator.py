from data_handling import load_data


def process_data(file_path: str):

    df = load_data(file_path)

    #add other processing steps

    return df