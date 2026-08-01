from typing import List, Optional
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    full_name: str
    mobile: str
    email: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    role: str
    is_verified: bool

    class Config:
        from_attributes = True
