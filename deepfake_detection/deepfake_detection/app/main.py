from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import os
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
from . import models, schemas, crud, database, deepfake_detector
import cv2
import numpy as np

SECRET_KEY = "supersecretkey"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEDIA_DIR = "media"
os.makedirs(MEDIA_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.mp4', '.avi', '.mov'}
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png'}
VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov'}

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

@app.on_event("startup")
def on_startup():
    models.Base.metadata.create_all(bind=database.engine)

@app.get("/")
def read_root():
    return {"message": "Deepfake Detection API is running."}

@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/upload/", response_model=schemas.Media)
def upload_media(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Please upload a JPG, PNG image or MP4, AVI, MOV video.")
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_location = os.path.join(MEDIA_DIR, unique_filename)
    with open(file_location, "wb") as f:
        f.write(file.file.read())
    db_media = crud.create_media(db, filename=unique_filename, user_id=current_user.id)
    return db_media

@app.post("/detect/{media_id}", response_model=schemas.DetectionResult)
def detect_media(media_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_media = crud.get_media(db, media_id)
    if not db_media or db_media.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Media not found")
    file_path = os.path.join(MEDIA_DIR, db_media.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    ext = os.path.splitext(db_media.filename)[1].lower()
    if ext in IMAGE_EXTENSIONS:
        is_deepfake, confidence = deepfake_detector.detect_deepfake(file_path)
    elif ext in VIDEO_EXTENSIONS:
        # Extract frames and run detection on each
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video file.")
        frame_results = []
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps else 0
        sample_rate = int(fps) if fps else 1  # 1 frame per second
        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % sample_rate == 0:
                # Save temp image
                temp_path = file_path + f"_frame{frame_idx}.jpg"
                cv2.imwrite(temp_path, frame)
                is_df, conf = deepfake_detector.detect_deepfake(temp_path)
                frame_results.append((is_df, conf))
                os.remove(temp_path)
            frame_idx += 1
        cap.release()
        if not frame_results:
            raise HTTPException(status_code=400, detail="No frames extracted from video.")
        # Aggregate: majority vote for is_deepfake, average confidence
        is_deepfake = int(sum(r[0] for r in frame_results) > len(frame_results) / 2)
        confidence = float(np.mean([r[1] for r in frame_results]))
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type for detection.")
    db_result = crud.create_detection_result(db, media_id, is_deepfake, confidence)
    return db_result

@app.get("/result/{media_id}", response_model=schemas.DetectionResult)
def get_detection_result(media_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_result = crud.get_detection_result(db, media_id)
    db_media = crud.get_media(db, media_id)
    if not db_result or not db_media or db_media.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Detection result not found")
    return db_result 