from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from datetime import datetime
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    message = Column(String(500), nullable=False)
    related_po_id = Column(String(36), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=True, index=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
