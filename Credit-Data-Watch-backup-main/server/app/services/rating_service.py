from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.models import CompanyRating, Company, User
from app.schemas.rating import RatingCreate, RatingUpdate
from uuid import uuid4
from datetime import datetime
from datetime import timezone, timezone

class RatingService:
    @staticmethod
    async def create_rating(db: AsyncSession, from_user: User, payload: RatingCreate):
        if not from_user.company_id:
            raise Exception("User must be associated with a company to rate others")
        
        # Check if already rated
        stmt = select(CompanyRating).where(
            CompanyRating.from_company_id == from_user.company_id,
            CompanyRating.to_company_id == payload.to_company_id
        )
        res = await db.execute(stmt)
        existing = res.scalars().first()
        
        if existing:
            # Update existing
            existing.rating = payload.rating
            existing.review = payload.review
            existing.updated_at = datetime.now(timezone.utc)
            rating_obj = existing
        else:
            # Create new
            rating_obj = CompanyRating(
                id=str(uuid4()),
                from_company_id=from_user.company_id,
                to_company_id=payload.to_company_id,
                rating=payload.rating,
                review=payload.review
            )
            db.add(rating_obj)
        
        await db.flush()
        
        # Recalculate global_cbi_stars for the target company
        await RatingService.update_company_cbi(db, payload.to_company_id)
        
        return rating_obj

    @staticmethod
    async def update_company_cbi(db: AsyncSession, company_id: str):
        # Calculate average rating
        stmt = select(func.avg(CompanyRating.rating)).where(CompanyRating.to_company_id == company_id)
        res = await db.execute(stmt)
        avg_rating = res.scalar() or 0.0
        
        # Update company model
        await db.execute(
            update(Company)
            .where(Company.id == company_id)
            .values(global_cbi_stars=round(float(avg_rating), 2))
        )
        await db.flush()

    @staticmethod
    async def get_company_ratings(db: AsyncSession, company_id: str):
        stmt = select(CompanyRating).where(CompanyRating.to_company_id == company_id).order_by(CompanyRating.created_at.desc())
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def get_all_companies_cbi(db: AsyncSession):
        stmt = select(Company).order_by(Company.global_cbi_stars.desc())
        res = await db.execute(stmt)
        return res.scalars().all()
