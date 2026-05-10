from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    nickname: str
    tag: str
    score: int
    max_score: int = 0
    tier: str = "UNKNOWN"
    rank: str = ""
    max_tier: str = "UNKNOWN"
    max_rank: str = ""
    last_updated: Optional[datetime] = None

class UserCreate(BaseModel):
    nickname: str
    tag: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True
