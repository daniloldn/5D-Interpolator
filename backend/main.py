from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
import os, uuid, hashlib
from interpolator_5d.orchestrator import process_data
from datetime import datetime





app = FastAPI()


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
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "api_version": "1.0",
        "docs_url": "/docs"
    }

#uplaoding the data set
@app.post("/upload/")
async def uplaod(background_tasks: BackgroundTasks,file: UploadFile = File(...)):
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
