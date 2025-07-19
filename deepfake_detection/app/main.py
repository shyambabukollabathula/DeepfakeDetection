from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import os
from . import models, schemas, crud, database, deepfake_detector
import uuid

app = FastAPI()

MEDIA_DIR = "media"
os.makedirs(MEDIA_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    models.Base.metadata.create_all(bind=database.engine)

@app.get("/")
def read_root():
    return {"message": "Deepfake Detection API is running."}

@app.post("/upload/", response_model=schemas.Media)
def upload_media(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Please upload a JPG or PNG image.")
    # Generate a unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_location = os.path.join(MEDIA_DIR, unique_filename)
    with open(file_location, "wb") as f:
        f.write(file.file.read())
    # Only use unique_filename for the DB record
    db_media = crud.create_media(db, filename=unique_filename)
    return db_media

@app.post("/detect/{media_id}", response_model=schemas.DetectionResult)
def detect_media(media_id: int, db: Session = Depends(get_db)):
    db_media = crud.get_media(db, media_id)
    if not db_media:
        raise HTTPException(status_code=404, detail="Media not found")
    file_path = os.path.join(MEDIA_DIR, db_media.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    is_deepfake, confidence = deepfake_detector.detect_deepfake(file_path)
    db_result = crud.create_detection_result(db, media_id, is_deepfake, confidence)
    return db_result

@app.get("/result/{media_id}", response_model=schemas.DetectionResult)
def get_detection_result(media_id: int, db: Session = Depends(get_db)):
    db_result = crud.get_detection_result(db, media_id)
    if not db_result:
        raise HTTPException(status_code=404, detail="Detection result not found")
    return db_result 