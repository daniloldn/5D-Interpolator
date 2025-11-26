'use client';

import { useState } from 'react';

interface UploadResponse {
  message: string;
  file_id: string;
  status: string;
}

interface TrainConfig {
  file_id: string;
  hidden_layer_sizes: number[];
  activation: string;
  opt_algo: string;
  max_iter: number;
  random_state: number;
}

interface TrainResponse {
  message: string;
  file_id: string;
  final_loss: number;
}

interface PredictResponse {
  prediction: number;
  file_id: string;
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [trainStatus, setTrainStatus] = useState<string>('');
  const [predictStatus, setPredictStatus] = useState<string>('');
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  
  // Training configuration
  const [hiddenLayers, setHiddenLayers] = useState<string>('100,50');
  const [activation, setActivation] = useState<string>('relu');
  const [optimizer, setOptimizer] = useState<string>('adam');
  const [maxIterations, setMaxIterations] = useState<number>(200);
  
  // Prediction inputs
  const [predictionInputs, setPredictionInputs] = useState<string>('1.0,2.0,3.0,4.0,5.0');
  const [predictionResult, setPredictionResult] = useState<number | null>(null);
  const [finalLoss, setFinalLoss] = useState<number | null>(null);

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      setUploadStatus('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      setUploadStatus('Uploading...');
      const response = await fetch('http://127.0.0.1:8000/upload/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result: UploadResponse = await response.json();
        setFileId(result.file_id);
        setUploadStatus(`${result.message} (ID: ${result.file_id})`);
      } else {
        setUploadStatus('Upload failed. Please check file format.');
      }
    } catch (error) {
      setUploadStatus('Error connecting to server.');
    }
  };

  const handleTrainModel = async () => {
    if (!fileId) {
      setTrainStatus('Please upload a file first.');
      return;
    }

    const hiddenLayerSizes = hiddenLayers.split(',').map(size => parseInt(size.trim()));
    
    const config: TrainConfig = {
      file_id: fileId,
      hidden_layer_sizes: hiddenLayerSizes,
      activation,
      opt_algo: optimizer,
      max_iter: maxIterations,
      random_state: 42
    };

    try {
      setIsTraining(true);
      setTrainStatus('Training neural network...');
      
      const response = await fetch('http://127.0.0.1:8000/train/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const result: TrainResponse = await response.json();
        setFinalLoss(result.final_loss);
        setTrainStatus(`Training completed. Final loss: ${result.final_loss.toFixed(6)}`);
      } else {
        const error = await response.json();
        setTrainStatus(`Training failed: ${error.detail}`);
      }
    } catch (error) {
      setTrainStatus('Error during training.');
    } finally {
      setIsTraining(false);
    }
  };

  const handlePredict = async () => {
    if (!fileId) {
      setPredictStatus('Please train a model first.');
      return;
    }

    const inputs = predictionInputs.split(',').map(val => parseFloat(val.trim()));
    
    if (inputs.length !== 5) {
      setPredictStatus('Please provide exactly 5 input values.');
      return;
    }

    try {
      setIsPredicting(true);
      setPredictStatus('Making prediction...');
      
      const response = await fetch('http://127.0.0.1:8000/predict/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          inputs: inputs
        }),
      });

      if (response.ok) {
        const result: PredictResponse = await response.json();
        setPredictionResult(result.prediction);
        setPredictStatus(`Prediction: ${result.prediction.toFixed(6)}`);
      } else {
        const error = await response.json();
        setPredictStatus(`Prediction failed: ${error.detail}`);
      }
    } catch (error) {
      setPredictStatus('Error during prediction.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eeece2] py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#3d3929] mb-4">
            5D Interpolator
          </h1>
          <p className="text-lg text-[#3d3929]/80 max-w-2xl mx-auto">
            Upload a 5-dimensional dataset, configure and train a neural network, 
            then generate predictions using the trained model.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Upload Section */}
          <section className="bg-white rounded-lg shadow-lg p-6 border border-[#da7756]/20">
            <h2 className="text-xl font-semibold text-[#3d3929] mb-4">
              Dataset Upload
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#3d3929] mb-2">
                  Select PKL File
                </label>
                <input
                  type="file"
                  accept=".pkl"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-[#3d3929] file:mr-4 file:py-2 file:px-4 
                           file:rounded file:border-0 file:text-sm file:font-medium 
                           file:bg-[#da7756] file:text-white hover:file:bg-[#da7756]/90
                           border border-[#da7756]/30 rounded"
                />
              </div>
              
              <button
                onClick={handleFileUpload}
                disabled={!uploadedFile}
                className="w-full bg-[#da7756] text-white py-2 px-4 rounded font-medium
                         hover:bg-[#da7756]/90 disabled:bg-[#da7756]/50 disabled:cursor-not-allowed
                         transition-colors"
              >
                Upload Dataset
              </button>
              
              {uploadStatus && (
                <div className="text-sm text-[#3d3929] bg-[#eeece2] p-3 rounded">
                  {uploadStatus}
                </div>
              )}
            </div>
          </section>

          {/* Training Configuration */}
          <section className="bg-white rounded-lg shadow-lg p-6 border border-[#da7756]/20">
            <h2 className="text-xl font-semibold text-[#3d3929] mb-4">
              Neural Network Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#3d3929] mb-2">
                  Hidden Layer Sizes (comma-separated)
                </label>
                <input
                  type="text"
                  value={hiddenLayers}
                  onChange={(e) => setHiddenLayers(e.target.value)}
                  placeholder="100,50"
                  className="w-full border border-[#da7756]/30 rounded px-3 py-2 text-[#3d3929]
                           focus:outline-none focus:border-[#da7756]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#3d3929] mb-2">
                  Activation Function
                </label>
                <select
                  value={activation}
                  onChange={(e) => setActivation(e.target.value)}
                  className="w-full border border-[#da7756]/30 rounded px-3 py-2 text-[#3d3929]
                           focus:outline-none focus:border-[#da7756]"
                >
                  <option value="relu">ReLU</option>
                  <option value="tanh">Tanh</option>
                  <option value="logistic">Sigmoid</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#3d3929] mb-2">
                  Optimizer
                </label>
                <select
                  value={optimizer}
                  onChange={(e) => setOptimizer(e.target.value)}
                  className="w-full border border-[#da7756]/30 rounded px-3 py-2 text-[#3d3929]
                           focus:outline-none focus:border-[#da7756]"
                >
                  <option value="adam">Adam</option>
                  <option value="sgd">SGD</option>
                  <option value="lbfgs">L-BFGS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#3d3929] mb-2">
                  Max Iterations
                </label>
                <input
                  type="number"
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                  className="w-full border border-[#da7756]/30 rounded px-3 py-2 text-[#3d3929]
                           focus:outline-none focus:border-[#da7756]"
                />
              </div>
              
              <button
                onClick={handleTrainModel}
                disabled={!fileId || isTraining}
                className="w-full bg-[#3d3929] text-white py-2 px-4 rounded font-medium
                         hover:bg-[#3d3929]/90 disabled:bg-[#3d3929]/50 disabled:cursor-not-allowed
                         transition-colors"
              >
                {isTraining ? 'Training...' : 'Train Neural Network'}
              </button>
              
              {trainStatus && (
                <div className="text-sm text-[#3d3929] bg-[#eeece2] p-3 rounded">
                  {trainStatus}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Prediction Section */}
        <section className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-[#da7756]/20">
          <h2 className="text-xl font-semibold text-[#3d3929] mb-4">
            Make Predictions
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#3d3929] mb-2">
                Input Values (5 comma-separated numbers)
              </label>
              <input
                type="text"
                value={predictionInputs}
                onChange={(e) => setPredictionInputs(e.target.value)}
                placeholder="1.0,2.0,3.0,4.0,5.0"
                className="w-full border border-[#da7756]/30 rounded px-3 py-2 text-[#3d3929]
                         focus:outline-none focus:border-[#da7756]"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handlePredict}
                disabled={!finalLoss || isPredicting}
                className="w-full bg-[#da7756] text-white py-2 px-4 rounded font-medium
                         hover:bg-[#da7756]/90 disabled:bg-[#da7756]/50 disabled:cursor-not-allowed
                         transition-colors"
              >
                {isPredicting ? 'Predicting...' : 'Generate Prediction'}
              </button>
            </div>
          </div>
          
          {predictStatus && (
            <div className="mt-4 text-sm text-[#3d3929] bg-[#eeece2] p-3 rounded">
              {predictStatus}
            </div>
          )}
          
          {predictionResult !== null && (
            <div className="mt-4 p-4 bg-[#da7756]/10 border border-[#da7756]/30 rounded">
              <h3 className="font-medium text-[#3d3929] mb-2">Prediction Result</h3>
              <p className="text-2xl font-bold text-[#da7756]">
                {predictionResult.toFixed(6)}
              </p>
            </div>
          )}
        </section>

        {/* Model Summary */}
        {finalLoss !== null && (
          <section className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-[#da7756]/20">
            <h2 className="text-xl font-semibold text-[#3d3929] mb-4">
              Model Summary
            </h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-[#eeece2] rounded">
                <h3 className="font-medium text-[#3d3929] mb-1">Architecture</h3>
                <p className="text-sm text-[#3d3929]/80">{hiddenLayers}</p>
              </div>
              <div className="text-center p-4 bg-[#eeece2] rounded">
                <h3 className="font-medium text-[#3d3929] mb-1">Activation</h3>
                <p className="text-sm text-[#3d3929]/80">{activation.toUpperCase()}</p>
              </div>
              <div className="text-center p-4 bg-[#eeece2] rounded">
                <h3 className="font-medium text-[#3d3929] mb-1">Final Loss</h3>
                <p className="text-sm text-[#3d3929]/80">{finalLoss.toFixed(6)}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
