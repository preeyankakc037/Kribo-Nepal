from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app import crud, schemas, models
from app.core.security import create_access_token, hash_password, verify_password

router = APIRouter()


# ── Marketplace Routes ────────────────────────────────────────────────────────

@router.post("/marketplace", response_model=schemas.MarketplaceResponse)
def create_marketplace_post(
    post: schemas.MarketplaceCreate,
    db: Session = Depends(get_db)
):
    return crud.create_post(db, post)


@router.get("/marketplace", response_model=list[schemas.MarketplaceResponse])
def get_marketplace_posts(
    db: Session = Depends(get_db)
):
    return crud.get_posts(db)


# ── Auth Routes ───────────────────────────────────────────────────────────────

@router.post("/api/auth/register", response_model=schemas.TokenResponse, status_code=201)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.mobile == payload.mobile).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this mobile number already exists. Please log in instead."
        )

    if payload.email and db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in instead."
        )

    user = models.User(
        full_name=payload.full_name,
        mobile=payload.mobile,
        email=payload.email,
        address=payload.address,
        location=payload.location,
        role=models.UserRole(payload.role),
        hashed_password=hash_password(payload.password),
        profile_photo=payload.profile_photo,
        # For this frontend prototype, submitting the requested document grants
        # the visible trust badge. A production version should have staff review.
        is_verified=payload.verification_submitted,
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        # Covers a race where the same mobile/email is submitted twice at once.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this mobile number or email already exists. Please log in instead."
        )

    if payload.role == "farmer":
        fp = payload.farmer_profile
        profile = models.FarmerProfile(
            user_id=user.id,
            harvest_scale=fp.harvest_scale if fp else None,
            crops=fp.crops if fp else [],
            payment_account=fp.payment_account if fp else None,
        )
        db.add(profile)
    elif payload.role == "broker":
        bp = payload.broker_profile
        profile = models.BrokerProfile(
            user_id=user.id,
            trading_scale=bp.trading_scale if bp else None,
            transport=bp.transport if bp else None,
            cold_storage=bp.cold_storage if bp else None,
            crops=bp.crops if bp else [],
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    user_out = schemas.UserOut(
        id=user.id,
        full_name=user.full_name,
        mobile=user.mobile,
        email=user.email,
        role=user.role.value,
        is_verified=user.is_verified,
        address=user.address,
        location=user.location,
        profile_photo=user.profile_photo,
    )
    return schemas.TokenResponse(access_token=token, user=user_out)


@router.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip()
    user = db.query(models.User).filter(models.User.mobile == identifier).first()
    if not user:
        user = db.query(models.User).filter(models.User.email == identifier).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Check your mobile/email and password."
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    user_out = schemas.UserOut(
        id=user.id,
        full_name=user.full_name,
        mobile=user.mobile,
        email=user.email,
        role=user.role.value,
        is_verified=user.is_verified,
        address=user.address,
        location=user.location,
        profile_photo=user.profile_photo,
    )
    return schemas.TokenResponse(access_token=token, user=user_out)


@router.get("/api/users", response_model=list[schemas.DirectoryUserOut])
def get_people(role: str | None = None, db: Session = Depends(get_db)):
    """Public marketplace directory; deliberately excludes mobile, email and address."""
    query = db.query(models.User).options(
        joinedload(models.User.farmer_profile),
        joinedload(models.User.broker_profile),
    )
    if role in ("farmer", "broker"):
        query = query.filter(models.User.role == models.UserRole(role))

    people = []
    for user in query.order_by(models.User.created_at.desc()).all():
        profile = user.farmer_profile if user.role == models.UserRole.farmer else user.broker_profile
        people.append(schemas.DirectoryUserOut(
            id=user.id,
            full_name=user.full_name,
            role=user.role.value,
            location=user.location,
            profile_photo=user.profile_photo,
            is_verified=user.is_verified,
            crops=profile.crops or [] if profile else [],
            scale=(profile.harvest_scale if user.role == models.UserRole.farmer else profile.trading_scale) if profile else None,
            transport=profile.transport if user.role == models.UserRole.broker and profile else None,
        ))
    return people
