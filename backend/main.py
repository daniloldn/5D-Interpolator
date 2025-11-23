from fastapi import FastAPI, UploadFile, File, HTTPException
import os, uuid


app = FastAPI()


upload_folder = "uploads"
os.makedirs(upload_folder, exist_ok=True)

SUPPORTED_EXTS = { "pkl"}

#uplaoding the data set
@app.post("/data/upload")
async def uplaod(file: UploadFile = File(...)):
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
    
    return {"message": "File uploaded successfully"}
