from sqlalchemy import Column, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Step 2 — Farm profile
    harvest_scale = Column(String(200), nullable=True)   # Small / Commercial
    crops = Column(JSON, default=list)                   # ["🍅 Tomato", "🥔 Potato", ...]

    # Step 3 — Verification (file paths stored after upload)
    citizenship_photo_front = Column(String(500), nullable=True)
    citizenship_photo_back = Column(String(500), nullable=True)
    profile_photo = Column(String(500), nullable=True)
    payment_account = Column(String(300), nullable=True)  # eSewa / Khalti / bank

    user = relationship("User", back_populates="farmer_profile")
