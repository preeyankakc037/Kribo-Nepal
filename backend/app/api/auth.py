from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.models.farmer_profile import FarmerProfile
from app.models.broker_profile import BrokerProfile
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── Helper ────────────────────────────────────────────────────────────────────

def _user_to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        full_name=user.full_name,
        mobile=user.mobile,
        email=user.email,
        role=user.role.value,
        is_verified=user.is_verified,
    )


# ── POST /api/auth/register ───────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new farmer or broker account.
    Accepts all 3 steps of the signup form in a single JSON body.
    """

    # 1. Check for duplicate mobile
    if db.query(User).filter(User.mobile == payload.mobile).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this mobile number already exists.",
        )

    # 2. Check for duplicate email (if provided)
    if payload.email:
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            )

    # 3. Create the core User record
    user = User(
        full_name=payload.full_name,
        mobile=payload.mobile,
        email=payload.email,
        address=payload.address,
        location=payload.location,
        role=UserRole(payload.role),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.flush()  # get user.id without committing yet

    # 4. Create role-specific profile
    if payload.role == "farmer":
        fp = payload.farmer_profile
        profile = FarmerProfile(
            user_id=user.id,
            harvest_scale=fp.harvest_scale if fp else None,
            crops=fp.crops if fp else [],
            payment_account=fp.payment_account if fp else None,
        )
        db.add(profile)

    elif payload.role == "broker":
        bp = payload.broker_profile
        profile = BrokerProfile(
            user_id=user.id,
            trading_scale=bp.trading_scale if bp else None,
            transport=bp.transport if bp else None,
            cold_storage=bp.cold_storage if bp else None,
            crops=bp.crops if bp else [],
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    # 5. Issue JWT
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})

    return TokenResponse(access_token=token, user=_user_to_out(user))


# ── POST /api/auth/login ──────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with mobile number OR email address + password.
    Returns a JWT access token and the user's basic profile.
    """
    identifier = payload.identifier.strip()

    # Try mobile first, then email
    user = db.query(User).filter(User.mobile == identifier).first()
    if not user:
        user = db.query(User).filter(User.email == identifier).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Check your mobile/email and password.",
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, user=_user_to_out(user))


# ── GET /api/auth/me ──────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def me(db: Session = Depends(get_db), token_header: str = ""):
    """Return the currently logged-in user's profile (uses JWT)."""
    from app.core.security import get_current_user, bearer_scheme
    # This is handled by get_current_user dependency — see usage in protected routes
    raise HTTPException(status_code=501, detail="Use the dependency injection pattern")
