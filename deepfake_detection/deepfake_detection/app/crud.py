from sqlalchemy.orm import Session
from . import models, schemas
from typing import Optional
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_media(db: Session, filename: str, user_id: Optional[int] = None):
    db_media = models.Media(filename=filename, user_id=user_id)
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return db_media

def get_media(db: Session, media_id: int):
    return db.query(models.Media).filter(models.Media.id == media_id).first()

def create_detection_result(db: Session, media_id: int, is_deepfake: int, confidence: float):
    db_result = models.DetectionResult(media_id=media_id, is_deepfake=is_deepfake, confidence=confidence)
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_detection_result(db: Session, media_id: int):
    return db.query(models.DetectionResult).filter(models.DetectionResult.media_id == media_id).order_by(models.DetectionResult.id.desc()).first() 