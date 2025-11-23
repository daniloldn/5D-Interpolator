from fastapi import FastAPI, UploadFile, File
import os



app = FastAPI()


upload_folder = "uploads"
os.makedirs(upload_folder, exist_ok=True)

#uplaoding the data set
@app.post("/upload")
async def uplaod(file: UploadFile = File(...)):
    #path
    save_path = os.path.join(upload_folder, file.filename)

    #read and write uplaoded file
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)
    
    return {"message": "File uploaded successfully"}
