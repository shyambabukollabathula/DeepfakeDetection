from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DetectionResultBase(BaseModel):
    is_deepfake: int
    confidence: float
    detected_at: Optional[datetime] = None

class DetectionResultCreate(DetectionResultBase):
    pass

class DetectionResult(DetectionResultBase):
    id: int
    media_id: int

    class Config:
        orm_mode = True

class MediaBase(BaseModel):
    filename: str
    upload_time: Optional[datetime] = None

class MediaCreate(MediaBase):
    pass

class Media(MediaBase):
    id: int
    detection_result: Optional[DetectionResult] = None

    class Config:
        orm_mode = True 