from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class MediaBase(BaseModel):
    filename: str
    user_id: Optional[int] = None

class MediaCreate(MediaBase):
    pass

class Media(MediaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DetectionResultBase(BaseModel):
    is_deepfake: int
    confidence: float

class DetectionResultCreate(DetectionResultBase):
    media_id: int

class DetectionResult(DetectionResultBase):
    id: int
    media_id: int
    model_config = ConfigDict(from_attributes=True) 