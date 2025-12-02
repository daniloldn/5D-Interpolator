# 5D Interpolator

A full-stack web application that provides neural network-based interpolation for 5-dimensional numerical datasets. Upload your data, configure a neural network, and generate predictions through an intuitive web interface.

## Features

- **Data Upload**: Accept pickle files containing 5-dimensional datasets
- **Neural Network Training**: Configurable MLPRegressor with customizable architecture
- **Real-time Predictions**: Generate interpolated values for new 5D input vectors
- **Interactive UI**: Modern React interface with real-time training feedback
- **Dockerized Deployment**: Complete containerized setup for easy deployment

## Architecture

### Backend (FastAPI + Python)
- **FastAPI** web framework with async support
- **scikit-learn** MLPRegressor for neural network training
- **Data Processing**: Automatic validation, preprocessing, and train/test splitting
- **File Management**: Secure upload handling with content-based deduplication

### Frontend (Next.js + React)
- **Next.js 16** with React 19 and TypeScript
- **Tailwind CSS** for responsive design
- **Real-time updates** during training and prediction
- **Form validation** and error handling

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/daniloldn/5D-Interpolator.git
cd 5D-Interpolator
```

2. Start the application:
```bash
./run.sh up
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Development

For development with hot-reload:
```bash
./run.sh up
```

View logs:
```bash
./run.sh logs
```

Stop services:
```bash
./run.sh down
```

Force rebuild:
```bash
./run.sh rebuild
```

## Usage

### 1. Data Preparation
Prepare your dataset as a Python pickle file containing a dictionary:
```python
import pickle
import numpy as np

# Your 5D dataset
data = {
    "X": np.array([[1.0, 2.0, 3.0, 4.0, 5.0], ...]),  # Features (N x 5)
    "y": np.array([target_value, ...])                 # Targets (N,)
}

with open("dataset.pkl", "wb") as f:
    pickle.dump(data, f)
```

### 2. Upload Dataset
- Navigate to http://localhost:3000
- Upload your `.pkl` file using the file selector
- Wait for processing confirmation

### 3. Configure Neural Network
Set training parameters:
- **Hidden Layers**: Comma-separated layer sizes (e.g., "100,50")
- **Activation Function**: ReLU, Tanh, or Sigmoid
- **Optimizer**: Adam, SGD, or L-BFGS
- **Max Iterations**: Training epochs

### 4. Train Model
- Click "Train Neural Network"
- Monitor training progress in real-time
- View final loss and model summary

### 5. Generate Predictions
- Enter 5 comma-separated values for prediction
- Click "Generate Prediction"
- View interpolated result

## API Endpoints

### Backend API (http://localhost:8000)

- `POST /upload/` - Upload dataset file
- `GET /status/{file_id}` - Check processing status
- `POST /train/` - Train neural network
- `POST /predict/` - Generate predictions
- `DELETE /cleanup` - Remove all files
- `GET /docs` - API documentation (Swagger UI)

## Technical Details

### Data Processing Pipeline
1. **Validation**: Ensures 5-dimensional structure
2. **Preprocessing**: StandardScaler normalization and missing value imputation
3. **Splitting**: 80/20 train/test split with random state
4. **Training**: MLPRegressor with configurable hyperparameters

### Supported Formats
- **Input**: Pickle files with pandas DataFrame, numpy arrays, or dictionaries
- **Requirements**: Exactly 5 feature columns
- **Output**: Trained model predictions with loss metrics

### Docker Configuration
- **Multi-stage builds** for optimized production images
- **Volume mounting** for development hot-reload
- **Network isolation** with inter-service communication
- **Environment variables** for configuration

## File Structure

```
5D-Interpolator/
├── backend/
│   ├── interpolator_5d/
│   │   ├── data_handling.py    # Data validation and preprocessing
│   │   ├── network.py          # Neural network initialization
│   │   └── orchestrator.py     # Data processing pipeline
│   ├── main.py                 # FastAPI application
│   ├── pyproject.toml         # Python dependencies
│   └── Dockerfile             # Backend container
├── frontend/
│   ├── src/app/
│   │   └── page.tsx           # Main React component
│   ├── package.json           # Node.js dependencies
│   └── Dockerfile             # Frontend container
├── docker-compose.yml         # Service orchestration
└── run.sh                     # Management script
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker setup
5. Submit a pull request

## License

This project is open source. See LICENSE file for details.

## Support

For issues and questions, please use the GitHub Issues page.
