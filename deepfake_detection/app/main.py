from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import os
from . import models, schemas, crud, database, auth

# Use simple detector for deployment, full detector for local development
import os
if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RENDER"):
    from . import simple_detector as deepfake_detector
else:
    try:
        from . import deepfake_detector
    except ImportError:
        from . import simple_detector as deepfake_detector
import uuid

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://*.vercel.app",  # Allow all Vercel deployments
        "https://your-frontend-domain.vercel.app"  # Replace with your actual Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Authentication endpoints
@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/upload/", response_model=schemas.Media)
def upload_media(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Please upload a JPG or PNG image.")
    # Generate a unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_location = os.path.join(MEDIA_DIR, unique_filename)
    with open(file_location, "wb") as f:
        f.write(file.file.read())
    # Create media record with user_id
    db_media = crud.create_media(db, filename=unique_filename, user_id=current_user.id)
    return db_media

@app.post("/detect/{media_id}", response_model=schemas.DetectionResult)
def detect_media(
    media_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_media = crud.get_media(db, media_id)
    if not db_media:
        raise HTTPException(status_code=404, detail="Media not found")
    # Check if media belongs to current user
    if db_media.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this media")
    file_path = os.path.join(MEDIA_DIR, db_media.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    is_deepfake, confidence = deepfake_detector.detect_deepfake(file_path)
    db_result = crud.create_detection_result(db, media_id, is_deepfake, confidence)
    return db_result

@app.get("/result/{media_id}", response_model=schemas.DetectionResult)
def get_detection_result(
    media_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_result = crud.get_detection_result(db, media_id)
    if not db_result:
        raise HTTPException(status_code=404, detail="Detection result not found")
    # Check if media belongs to current user
    if db_result.media.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this result")
    return db_result 