from fastapi import FastAPI, UploadFile, File
import os, uuid


app = FastAPI()


upload_folder = "uploads"
os.makedirs(upload_folder, exist_ok=True)

#uplaoding the data set
@app.post("/upload")
async def uplaod(file: UploadFile = File(...)):
    #generating unique path
    ext = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    save_path = os.path.join(upload_folder, unique_name)

    #read and write uplaoded file
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)
    
    return {"message": "File uploaded successfully"}
