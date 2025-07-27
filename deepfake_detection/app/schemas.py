from pydantic import BaseModel, EmailStr
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
        from_attributes = True

class MediaBase(BaseModel):
    filename: str
    upload_time: Optional[datetime] = None

class MediaCreate(MediaBase):
    pass

class Media(MediaBase):
    id: int
    detection_result: Optional[DetectionResult] = None

    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None 