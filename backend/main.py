from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
import os, hashlib
from interpolator_5d.orchestrator import process_data
from interpolator_5d.network import init_nn
from datetime import datetime, timezone
from pydantic import BaseModel
from sklearn.metrics import mean_squared_error
from fastapi.middleware.cors import CORSMiddleware
import pickle





app = FastAPI()

#frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


upload_folder = "data/uploads"
processed_folder = "data/processed"

os.makedirs(upload_folder, exist_ok=True)
os.makedirs(processed_folder, exist_ok=True)

SUPPORTED_EXTS = { "pkl"}

#health check
@app.get("/")
async def root():
    return {
        "message": "5D Interpolator API",
        "status": "running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "api_version": "1.0",
        "docs_url": "/docs"
    }

#uplaoding the data set
@app.post("/upload/")
async def upload(background_tasks: BackgroundTasks,file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename.")
    ext = file.filename.split(".")[-1].lower()
    if ext not in SUPPORTED_EXTS:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {ext}")

    #read file contents
    contents = await file.read()
    
    # Generate content-based hash for deduplication
    file_hash = hashlib.md5(contents).hexdigest()
    unique_name = f"{file_hash}.{ext}"
    save_path = os.path.join(upload_folder, unique_name)
    processed_path = os.path.join(processed_folder, f"{file_hash}_processed.{ext}")
    
    # Check if already processed
    if os.path.exists(processed_path):
        return {
            "message": "File already processed (duplicate detected)",
            "file_id": file_hash,
            "status": "already_exists"
        }
    
    # Check if file already uploaded but not processed
    if not os.path.exists(save_path):
        with open(save_path, "wb") as f:
            f.write(contents)
    
    # Trigger background processing
    background_tasks.add_task(process_data, save_path)
    
    return {
        "message": "File uploaded successfully", 
        "file_id": file_hash,
        "status": "processing"
    }

#health check if file processed properly
@app.get("/status/{file_id}")
async def check_file_status(file_id: str):
    # Where processed files live
    processed_path = os.path.join(processed_folder, f"{file_id}_processed.pkl")
    if os.path.exists(processed_path):
        return {
            "file_id": file_id,
            "status": "processed",
            "processed_path": processed_path
        }
    upload_path = os.path.join(upload_folder, file_id)
    if os.path.exists(upload_path):
        return {
            "file_id": file_id,
            "status": "processing"
        }
    else:
        return {
            "file_id": file_id,
            "status": "not found"
        }

# Cleanup endpoint for removing uploaded/processed files
@app.delete("/cleanup")
async def cleanup_files():
    """Remove all uploaded and processed files (useful for testing)"""
    upload_count = 0
    processed_count = 0
    
    # Clean upload folder
    for filename in os.listdir(upload_folder):
        if filename.endswith('.pkl'):
            os.remove(os.path.join(upload_folder, filename))
            upload_count += 1
    
    # Clean processed folder  
    for filename in os.listdir(processed_folder):
        if filename.endswith('.pkl'):
            os.remove(os.path.join(processed_folder, filename))
            processed_count += 1
    
    return {
        "message": "Cleanup completed",
        "files_removed": {
            "uploads": upload_count,
            "processed": processed_count
        }
    }

#training the network 

class NNConfig(BaseModel):
    file_id: str
    hidden_layer_sizes: list[int] = [32]
    activation: str = "relu"
    opt_algo: str = "sgd"
    max_iter: int = 200
    random_state: int = 42
    #add learning rate

@app.post("/train/")
async def train_nn(config: NNConfig):
    processed_path = os.path.join(processed_folder, f"{config.file_id}_processed.pkl")
    if not os.path.exists(processed_path):
        raise HTTPException(status_code=404, detail="Processed file not found.")
    
    #open file
    with open(processed_path, "rb") as f:
        splits = pickle.load(f)
    X_train = splits["X_train"]
    y_train = splits["y_train"]
    X_test = splits["X_test"]
    y_test = splits["y_test"]

  

    #initialize nn

    mlp = init_nn(
        tuple(config.hidden_layer_sizes), config.activation, 
        config.opt_algo, config.max_iter, config.random_state
        )
    
     # Train model
    mlp.fit(X_train, y_train)

    #predict

    y_pred = mlp.predict(X_test)

    mse = mean_squared_error(y_test, y_pred)

    # Save model
    model_path = processed_path.replace("_processed.pkl", "_mlp.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(mlp, f)

    return {
        "message": f"Model trained and saved to {model_path}",
        "file_id": config.file_id,
        "final_loss": float(mse)  
    }


class NNpredict(BaseModel):
    file_id: str
    new_data: list[float] = [2.5, 6.9, 3.1, 4.1, 7.0]


# predict endpoint
@app.post("/predict/")
def predict(pred : NNpredict):
    model_path = os.path.join(processed_folder, f"{pred.file_id}_mlp.pkl")
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="model not found.")
    
    
    #open file
    with open(model_path, "rb") as f:
        loaded_model = pickle.load(f)


    #check new_data
    if len(pred.new_data) != 5:
        raise HTTPException(status_code=400, detail="Input must contain exactly 5 numbers.")
    
    print(f"Prediction request for file_id: {pred.file_id}")
    print(f"Input data: {pred.new_data}")
    
    prediction_input = [pred.new_data]

    #predict
    try:
        y_pred = loaded_model.predict(prediction_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    result_value = float(y_pred[0])

    return {
        "message": "interpolation Succesful",
        "file_id": pred.file_id, 
        "prediction": result_value
        }
