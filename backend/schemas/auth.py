from pydantic import BaseModel
from typing import Optional

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = "Student"

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    study_goal_hours: Optional[float] = None
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None

