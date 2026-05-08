from pydantic import BaseModel

class UserBase(BaseModel):
    nickname: str
    tag: str
    score: int
    max_score: int = 0
    tier: str = "UNKNOWN"
    rank: str = ""
    max_tier: str = "UNKNOWN"
    max_rank: str = ""

class UserCreate(BaseModel):
    nickname: str
    tag: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True
