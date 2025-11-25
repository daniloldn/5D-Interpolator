from sklearn.neural_network import MLPRegressor
import numpy as np


def init_nn(dimensions: list, activ: str,
              opt_algo: str, epochs: int, rand_state: int):
    "initiating a neural net"

    model = MLPRegressor(
    hidden_layer_sizes=dimensions,
    activation=activ,
    solver=opt_algo,
    max_iter=epochs,
    random_state=rand_state
    )
    return model