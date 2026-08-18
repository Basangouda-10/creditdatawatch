from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RatingBase(BaseModel):
    to_company_id: str
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None

class RatingCreate(RatingBase):
    pass

class RatingUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = None

class RatingResponse(RatingBase):
    id: str
    from_company_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GlobalCBISummary(BaseModel):
    company_id: str
    company_name: str
    average_rating: float
    total_ratings: int
    stars: float
