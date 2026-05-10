from sqlalchemy import Column, Integer, String, Float, UniqueConstraint, DateTime
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String, index=True)
    tag = Column(String, index=True)
    score = Column(Integer, default=0)
    max_score = Column(Integer, default=0)
    tier = Column(String, default="UNKNOWN")
    rank = Column(String, default="")
    max_tier = Column(String, default="UNKNOWN")
    max_rank = Column(String, default="")
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint('nickname', 'tag', name='_nickname_tag_uc'),)
