import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Enum, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class MarketplacePost(Base):
    __tablename__ = "marketplace_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_role = Column(String)            # "farmer" or "broker"
    full_name = Column(String)
    product_name = Column(String)
    variety = Column(String, nullable=True)
    quantity = Column(Integer)
    unit = Column(String)                 # e.g., "kg", "quintal", "ton"
    price = Column(Integer, nullable=True)
    price_discussion = Column(Boolean, default=False)
    harvest_date = Column(Date, nullable=True)
    availability = Column(String, nullable=True)
    organic = Column(Boolean, default=False)
    district = Column(String, nullable=True)
    municipality = Column(String, nullable=True)
    delivery_method = Column(String, nullable=True)
    description = Column(String, nullable=True)
    image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserRole(str, enum.Enum):
    farmer = "farmer"
    broker = "broker"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    mobile = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=True, index=True)
    address = Column(String(500), nullable=True)
    location = Column(String(300), nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    hashed_password = Column(String(500), nullable=False)
    is_verified = Column(Boolean, default=False)
    profile_photo = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    broker_profile = relationship("BrokerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    harvest_scale = Column(String(200), nullable=True)
    crops = Column(JSON, default=list)
    payment_account = Column(String(300), nullable=True)

    user = relationship("User", back_populates="farmer_profile")


class BrokerProfile(Base):
    __tablename__ = "broker_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    trading_scale = Column(String(300), nullable=True)
    transport = Column(String(200), nullable=True)
    cold_storage = Column(String(10), nullable=True)
    crops = Column(JSON, default=list)

    user = relationship("User", back_populates="broker_profile")
