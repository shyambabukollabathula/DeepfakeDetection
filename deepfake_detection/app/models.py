from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Media(Base):
    __tablename__ = "media"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    upload_time = Column(DateTime, default=datetime.utcnow)
    detection_result = relationship("DetectionResult", back_populates="media", uselist=False)

class DetectionResult(Base):
    __tablename__ = "detection_results"
    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("media.id"))
    is_deepfake = Column(Integer)  # 1 for deepfake, 0 for real
    confidence = Column(Float)
    detected_at = Column(DateTime, default=datetime.utcnow)
    media = relationship("Media", back_populates="detection_result") 