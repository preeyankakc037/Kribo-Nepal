import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


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
    location = Column(String(300), nullable=True)          # Province/district/municipality
    role = Column(Enum(UserRole), nullable=False)
    hashed_password = Column(String(500), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer_profile = relationship(
        "FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    broker_profile = relationship(
        "BrokerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
