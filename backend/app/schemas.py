from __future__ import annotations
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator


# ── Marketplace Schemas ───────────────────────────────────────────────────────

class MarketplaceCreate(BaseModel):
    user_role: str
    full_name: str
    product_name: str
    variety: Optional[str] = ""
    quantity: int
    unit: str
    price: Optional[int] = None
    price_discussion: bool = False
    harvest_date: Optional[date] = None
    availability: Optional[str] = ""
    organic: bool = False
    district: Optional[str] = ""
    municipality: Optional[str] = ""
    delivery_method: Optional[str] = ""
    description: Optional[str] = ""
    image: Optional[str] = None


class MarketplaceResponse(MarketplaceCreate):
    id: int

    class Config:
        from_attributes = True


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class FarmerProfileIn(BaseModel):
    harvest_scale: Optional[str] = None
    crops: Optional[List[str]] = []
    payment_account: Optional[str] = None


class BrokerProfileIn(BaseModel):
    trading_scale: Optional[str] = None
    transport: Optional[str] = None
    cold_storage: Optional[str] = None
    crops: Optional[List[str]] = []


class RegisterRequest(BaseModel):
    full_name: str
    mobile: str
    password: str
    confirm_password: str
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    location: Optional[str] = None
    role: str
    farmer_profile: Optional[FarmerProfileIn] = None
    broker_profile: Optional[BrokerProfileIn] = None
    profile_photo: Optional[str] = None
    verification_submitted: bool = False

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("farmer", "broker"):
            raise ValueError("role must be 'farmer' or 'broker'")
        return v


class LoginRequest(BaseModel):
    identifier: str
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    mobile: str
    email: Optional[str] = None
    role: str
    is_verified: bool
    address: Optional[str] = None
    location: Optional[str] = None
    profile_photo: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class DirectoryUserOut(BaseModel):
    id: int
    full_name: str
    role: str
    location: Optional[str] = None
    profile_photo: Optional[str] = None
    is_verified: bool
    crops: List[str] = []
    scale: Optional[str] = None
    transport: Optional[str] = None

    class Config:
        from_attributes = True
