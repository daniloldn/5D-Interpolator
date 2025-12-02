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

interface CleanupResponse {
  message: string;
  files_removed: {
    uploads: number;
    processed: number;
  };
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [trainStatus, setTrainStatus] = useState<string>('');
  const [predictStatus, setPredictStatus] = useState<string>('');
  const [cleanupStatus, setCleanupStatus] = useState<string>('');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload/`, {
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/train/`, {
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/predict/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          new_data: inputs
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

  const handleCleanup = async () => {
    try {
      setCleanupStatus('Cleaning up files...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/cleanup`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result: CleanupResponse = await response.json();
        setCleanupStatus(`${result.message}. Removed ${result.files_removed.uploads} upload(s) and ${result.files_removed.processed} processed file(s).`);
        
        // Reset all states since files are cleared
        setFileId('');
        setUploadStatus('');
        setTrainStatus('');
        setPredictStatus('');
        setPredictionResult(null);
        setFinalLoss(null);
        setUploadedFile(null);
      } else {
        setCleanupStatus('Cleanup failed.');
      }
    } catch (error) {
      setCleanupStatus('Error during cleanup.');
    }
  };

  return (
    <>
      <style>{`
        input[type="file"]::file-selector-button {
          background-color: rgb(119, 136, 115) !important;
        }
        input[type="file"]::file-selector-button:hover {
          background-color: rgb(95, 110, 92) !important;
        }
      `}</style>
      <div className="min-h-screen py-8" style={{ fontFamily: 'Baskerville, "Baskerville Old Face", "Hoefler Text", Garamond, "Times New Roman", serif', backgroundColor: 'rgb(241, 243, 224)' }}>
        <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'rgb(119, 136, 115)' }}>
            5D Interpolator
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(119, 136, 115, 0.8)' }}>
            Upload a 5-dimensional dataset, configure and train a neural network, 
            then generate predictions using the trained model.
          </p>
          
          {cleanupStatus && (
            <div className="mt-4 text-sm p-3 rounded max-w-md mx-auto" style={{ color: 'rgb(119, 136, 115)', backgroundColor: 'rgb(210, 220, 182)', border: '1px solid rgba(161, 188, 152, 0.5)' }}>
              {cleanupStatus}
            </div>
          )}
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Upload Section */}
          <section className="rounded-lg shadow-lg p-6" style={{ backgroundColor: 'white', border: '1px solid rgba(161, 188, 152, 0.3)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(119, 136, 115)' }}>
              Dataset Upload
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(119, 136, 115)' }}>
                  Select PKL File
                </label>
                <input
                  type="file"
                  accept=".pkl"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm border rounded
                           [&::file-selector-button]:mr-4 [&::file-selector-button]:py-2 [&::file-selector-button]:px-4
                           [&::file-selector-button]:rounded [&::file-selector-button]:border-0 
                           [&::file-selector-button]:text-sm [&::file-selector-button]:font-medium
                           [&::file-selector-button]:text-white [&::file-selector-button]:cursor-pointer
                           [&::file-selector-button]:transition-colors"
                  style={{ 
                    color: 'rgb(119, 136, 115)', 
                    borderColor: 'rgba(161, 188, 152, 0.5)',
                    '--file-button-bg': 'rgb(119, 136, 115)',
                    '--file-button-hover-bg': 'rgb(95, 110, 92)'
                  } as React.CSSProperties & { '--file-button-bg': string; '--file-button-hover-bg': string }}
                />
              </div>
              
              <button
                onClick={handleFileUpload}
                disabled={!uploadedFile}
                className="w-full text-white py-2 px-4 rounded font-medium
                         disabled:cursor-not-allowed transition-colors"
                style={{ 
                  backgroundColor: uploadedFile ? 'rgb(119, 136, 115)' : 'rgba(119, 136, 115, 0.5)'
                }}
                onMouseEnter={(e) => !uploadedFile || (e.target.style.backgroundColor = 'rgb(95, 110, 92)')}
                onMouseLeave={(e) => !uploadedFile || (e.target.style.backgroundColor = 'rgb(119, 136, 115)')}
              >
                Upload Dataset
              </button>
              
              {uploadStatus && (
                <div className="text-sm p-3 rounded" style={{ color: 'rgb(119, 136, 115)', backgroundColor: 'rgb(210, 220, 182)' }}>
                  {uploadStatus}
                </div>
              )}
              
              {/* Cleanup Section */}
              <div className="pt-4" style={{ borderTop: '1px solid rgba(161, 188, 152, 0.3)' }}>
                <button
                  onClick={handleCleanup}
                  className="w-full text-white py-2 px-4 rounded font-medium
                           transition-colors text-sm"
                  style={{ backgroundColor: 'rgba(119, 136, 115, 0.8)' }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'rgb(119, 136, 115)'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(119, 136, 115, 0.8)'}
                  title="Remove all uploaded and processed files"
                >
                  🗑️ Cleanup All Files
                </button>
                <p className="text-xs mt-2 text-center" style={{ color: 'rgba(119, 136, 115, 0.6)' }}>
                  Removes all uploaded and processed files from server
                </p>
              </div>
            </div>
          </section>

          {/* Training Configuration */}
          <section className="rounded-lg shadow-lg p-6" style={{ backgroundColor: 'white', border: '1px solid rgba(161, 188, 152, 0.3)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(119, 136, 115)' }}>
              Neural Network Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(119, 136, 115)' }}>
                  Hidden Layer Sizes (comma-separated)
                </label>
                <input
                  type="text"
                  value={hiddenLayers}
                  onChange={(e) => setHiddenLayers(e.target.value)}
                  placeholder="100,50"
                  className="w-full border rounded px-3 py-2
                           focus:outline-none"
                  style={{ color: 'rgb(119, 136, 115)', borderColor: 'rgba(161, 188, 152, 0.5)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgb(161, 188, 152)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(161, 188, 152, 0.5)'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(119, 136, 115)' }}>
                  Activation Function
                </label>
                <select
                  value={activation}
                  onChange={(e) => setActivation(e.target.value)}
                  className="w-full border rounded px-3 py-2
                           focus:outline-none"
                  style={{ color: 'rgb(119, 136, 115)', borderColor: 'rgba(161, 188, 152, 0.5)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgb(161, 188, 152)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(161, 188, 152, 0.5)'}
                >
                  <option value="relu">ReLU</option>
                  <option value="tanh">Tanh</option>
                  <option value="logistic">Sigmoid</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(119, 136, 115)' }}>
                  Optimizer
                </label>
                <select
                  value={optimizer}
                  onChange={(e) => setOptimizer(e.target.value)}
                  className="w-full border rounded px-3 py-2
                           focus:outline-none"
                  style={{ color: 'rgb(119, 136, 115)', borderColor: 'rgba(161, 188, 152, 0.5)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgb(161, 188, 152)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(161, 188, 152, 0.5)'}
                >
                  <option value="adam">Adam</option>
                  <option value="sgd">SGD</option>
                  <option value="lbfgs">L-BFGS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(119, 136, 115)' }}>
                  Max Iterations
                </label>
                <input
                  type="number"
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2
                           focus:outline-none"
                  style={{ color: 'rgb(119, 136, 115)', borderColor: 'rgba(161, 188, 152, 0.5)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgb(161, 188, 152)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(161, 188, 152, 0.5)'}
                />
              </div>
              
              <button
                onClick={handleTrainModel}
                disabled={!fileId || isTraining}
                className="w-full text-white py-2 px-4 rounded font-medium
                         disabled:cursor-not-allowed transition-colors"
                style={{ 
                  backgroundColor: (!fileId || isTraining) ? 'rgba(95, 110, 92, 0.5)' : 'rgb(95, 110, 92)'
                }}
                onMouseEnter={(e) => (fileId && !isTraining) && (e.target.style.backgroundColor = 'rgb(75, 88, 72)')}
                onMouseLeave={(e) => (fileId && !isTraining) && (e.target.style.backgroundColor = 'rgb(95, 110, 92)')}
              >
                {isTraining ? 'Training...' : 'Train Neural Network'}
              </button>
              
              {trainStatus && (
                <div className="text-sm p-3 rounded" style={{ color: 'rgb(119, 136, 115)', backgroundColor: 'rgb(210, 220, 182)' }}>
                  {trainStatus}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Prediction Section */}
        <section className="mt-8 rounded-lg shadow-lg p-6" style={{ backgroundColor: 'white', border: '1px solid rgba(161, 188, 152, 0.3)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(119, 136, 115)' }}>
            Make Predictions
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(119, 136, 115)' }}>
                Input Values (5 comma-separated numbers)
              </label>
              <input
                type="text"
                value={predictionInputs}
                onChange={(e) => setPredictionInputs(e.target.value)}
                placeholder="1.0,2.0,3.0,4.0,5.0"
                className="w-full border rounded px-3 py-2
                         focus:outline-none"
                style={{ color: 'rgb(119, 136, 115)', borderColor: 'rgba(161, 188, 152, 0.5)' }}
                onFocus={(e) => e.target.style.borderColor = 'rgb(161, 188, 152)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(161, 188, 152, 0.5)'}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handlePredict}
                disabled={!finalLoss || isPredicting}
                className="w-full text-white py-2 px-4 rounded font-medium
                         disabled:cursor-not-allowed transition-colors"
                style={{ 
                  backgroundColor: (!finalLoss || isPredicting) ? 'rgba(119, 136, 115, 0.5)' : 'rgb(119, 136, 115)'
                }}
                onMouseEnter={(e) => (finalLoss && !isPredicting) && (e.target.style.backgroundColor = 'rgb(95, 110, 92)')}
                onMouseLeave={(e) => (finalLoss && !isPredicting) && (e.target.style.backgroundColor = 'rgb(119, 136, 115)')}
              >
                {isPredicting ? 'Predicting...' : 'Generate Prediction'}
              </button>
            </div>
          </div>
          
          {predictStatus && (
            <div className="mt-4 text-sm p-3 rounded" style={{ color: 'rgb(119, 136, 115)', backgroundColor: 'rgb(210, 220, 182)' }}>
              {predictStatus}
            </div>
          )}
          
          {predictionResult !== null && (
            <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'rgba(161, 188, 152, 0.2)', border: '1px solid rgba(161, 188, 152, 0.5)' }}>
              <h3 className="font-medium mb-2" style={{ color: 'rgb(119, 136, 115)' }}>Prediction Result</h3>
              <p className="text-2xl font-bold" style={{ color: 'rgb(161, 188, 152)' }}>
                {predictionResult.toFixed(6)}
              </p>
            </div>
          )}
        </section>

        {/* Model Summary */}
        {finalLoss !== null && (
          <section className="mt-8 rounded-lg shadow-lg p-6" style={{ backgroundColor: 'white', border: '1px solid rgba(161, 188, 152, 0.3)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(119, 136, 115)' }}>
              Model Summary
            </h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgb(210, 220, 182)' }}>
                <h3 className="font-medium mb-1" style={{ color: 'rgb(119, 136, 115)' }}>Architecture</h3>
                <p className="text-sm" style={{ color: 'rgba(119, 136, 115, 0.8)' }}>{hiddenLayers}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgb(210, 220, 182)' }}>
                <h3 className="font-medium mb-1" style={{ color: 'rgb(119, 136, 115)' }}>Activation</h3>
                <p className="text-sm" style={{ color: 'rgba(119, 136, 115, 0.8)' }}>{activation.toUpperCase()}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgb(210, 220, 182)' }}>
                <h3 className="font-medium mb-1" style={{ color: 'rgb(119, 136, 115)' }}>Final Loss</h3>
                <p className="text-sm" style={{ color: 'rgba(119, 136, 115, 0.8)' }}>{finalLoss.toFixed(6)}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  );
}
