from sqlalchemy.orm import Session
from . import models, schemas

def create_media(db: Session, filename: str) -> models.Media:
    db_media = models.Media(filename=filename)
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