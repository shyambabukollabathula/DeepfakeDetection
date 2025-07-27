from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash

# User CRUD operations
def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# Media CRUD operations
def create_media(db: Session, filename: str, user_id: int) -> models.Media:
    db_media = models.Media(filename=filename, user_id=user_id)
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return db_media

def get_media(db: Session, media_id: int):
    return db.query(models.Media).filter(models.Media.id == media_id).first()

def create_detection_result(db: Session, media_id: int, is_deepfake: int, confidence: float) -> models.DetectionResult:
    db_result = models.DetectionResult(media_id=media_id, is_deepfake=is_deepfake, confidence=confidence)
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_detection_result(db: Session, media_id: int):
    return db.query(models.DetectionResult).filter(models.DetectionResult.media_id == media_id).first() 