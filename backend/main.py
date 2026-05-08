from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from . import models, schemas, database, riot_api
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TIER_ORDER = {
    "CHALLENGER": 9,
    "GRANDMASTER": 8,
    "MASTER": 7,
    "DIAMOND": 6,
    "EMERALD": 5,
    "PLATINUM": 4,
    "GOLD": 3,
    "SILVER": 2,
    "BRONZE": 1,
    "IRON": 0,
    "UNKNOWN": -1
}

RANK_ORDER = {
    "I": 3,
    "II": 2,
    "III": 1,
    "IV": 0,
    "": 0
}

def calculate_total_score(tier: str, rank: str, lp: int) -> int:
    """티어, 랭크, LP를 하나의 숫자로 변환하여 비교 가능하게 함"""
    t_val = TIER_ORDER.get(tier.upper(), -1)
    r_val = RANK_ORDER.get(rank.upper(), 0)
    # 각 티어는 400점 차이, 각 랭크는 100점 차이로 계산
    return (t_val * 400) + (r_val * 100) + lp

@app.get("/rankings", response_model=List[schemas.User])
def get_rankings(
    limit: Optional[int] = Query(None, description="Limit the number of results"),
    db: Session = Depends(get_db)
):
    query = db.query(models.User).order_by(models.User.score.desc())
    if limit:
        query = query.limit(limit)
    return query.all()

@app.get("/global-rankings", response_model=List[schemas.UserBase])
def get_global_rankings():
    # Fetch real-time top 50 Challenger players from KR server
    return riot_api.get_global_top_50()

@app.post("/users", response_model=schemas.User)
def create_or_update_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Fetch score, tier, and rank from Riot API
    score, tier, rank = riot_api.get_summoner_lp(user.nickname, user.tag)
    current_total = calculate_total_score(tier, rank, score)

    # Check if user already exists
    db_user = db.query(models.User).filter(
        models.User.nickname == user.nickname, 
        models.User.tag == user.tag
    ).first()
    
    if db_user:
        # Calculate existing max total score
        max_total = calculate_total_score(db_user.max_tier, db_user.max_rank, db_user.max_score)
        
        # Update existing user score and tier
        db_user.score = score
        db_user.tier = tier
        db_user.rank = rank
        
        # Update max fields if current rank is higher
        if current_total > max_total:
            db_user.max_score = score
            db_user.max_tier = tier
            db_user.max_rank = rank
            
        db.commit()
        db.refresh(db_user)
        return db_user
    else:
        # Create new user
        new_user = models.User(
            nickname=user.nickname, 
            tag=user.tag, 
            score=score,
            max_score=score, 
            tier=tier,
            rank=rank,
            max_tier=tier,
            max_rank=rank
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
