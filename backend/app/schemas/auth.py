from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator


# ── Shared ────────────────────────────────────────────────────────────────────

class FarmerProfileIn(BaseModel):
    harvest_scale: Optional[str] = None
    crops: Optional[List[str]] = []
    payment_account: Optional[str] = None


class BrokerProfileIn(BaseModel):
    trading_scale: Optional[str] = None
    transport: Optional[str] = None
    cold_storage: Optional[str] = None
    crops: Optional[List[str]] = []


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    # Step 1 — Essential information
    full_name: str
    mobile: str
    password: str
    confirm_password: str
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    location: Optional[str] = None
    role: str  # "farmer" | "broker"

    # Step 2 — Role-specific profile (optional at registration)
    farmer_profile: Optional[FarmerProfileIn] = None
    broker_profile: Optional[BrokerProfileIn] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("farmer", "broker"):
            raise ValueError("role must be 'farmer' or 'broker'")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        digits = v.replace(" ", "").replace("-", "")
        if not digits.isdigit() or len(digits) < 10:
            raise ValueError("Enter a valid 10-digit mobile number")
        return digits


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Login with mobile number OR email + password."""
    identifier: str   # mobile or email
    password: str


# ── Responses ─────────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    full_name: str
    mobile: str
    email: Optional[str] = None
    role: str
    is_verified: bool

    class Config:
        from_attributes = True


TokenResponse.model_rebuild()
