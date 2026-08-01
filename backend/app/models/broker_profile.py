from sqlalchemy import Column, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class BrokerProfile(Base):
    __tablename__ = "broker_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Step 2 — Trading profile
    trading_scale = Column(String(300), nullable=True)   # Small / Medium / Large
    transport = Column(String(200), nullable=True)       # Pickup / Freight / None
    cold_storage = Column(String(10), nullable=True)     # Yes / No
    crops = Column(JSON, default=list)                   # preferred commodities

    # Step 3 — Verification
    pan_document = Column(String(500), nullable=True)
    citizenship_photo = Column(String(500), nullable=True)
    profile_photo = Column(String(500), nullable=True)

    user = relationship("User", back_populates="broker_profile")
