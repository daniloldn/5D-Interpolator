from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
import os, uuid
from interpolator_5d.orchestrator import process_data
from datetime import datetime





app = FastAPI()


upload_folder = "data/uploads"
processed_dir = "data/processed"

os.makedirs(upload_folder, exist_ok=True)

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

    #generating unique path
    unique_name = f"{uuid.uuid4()}.{ext}"
    save_path = os.path.join(upload_folder, unique_name)

    #read and write uplaoded file
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    # Trigger background processing
    background_tasks.add_task(process_data, save_path)
    
    return {"message": "File uploaded successfully", "file_id": unique_name}

#health check if file processed properly
@app.get("/status/{file_id}")
async def check_file_status(file_id: str):
    # Where processed files live
    processed_path = os.path.join(processed_dir, file_id.replace(".pkl", "_processed.pkl"))
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
