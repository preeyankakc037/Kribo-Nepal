from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app import crud, schemas, models
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
import base64, time

router = APIRouter()

# ── Simple in-memory TTL cache for the public directory ───────────────────────
# Keyed by role ('farmer' | 'broker' | None).  Each entry is (timestamp, data).
# 30-second TTL keeps the list fresh without hammering the remote Neon DB on
# every page visit.
_directory_cache: dict[str | None, tuple[float, list]] = {}
_DIRECTORY_TTL = 30  # seconds

# ── Marketplace post cache ─────────────────────────────────────────────────────
# Single entry: (timestamp, list[dict]).  Invalidated on every new POST so the
# freshly-created post appears immediately.
_marketplace_cache: tuple[float, list] | None = None
_MARKETPLACE_TTL = 30  # seconds


# ── Marketplace Routes ────────────────────────────────────────────────────────


def _photo_response(data_url: str | None) -> Response:
    """Convert a stored base64 data-URL into a proper HTTP image response
    with a 1-hour browser cache header so repeated visits are instant."""
    if not data_url:
        raise HTTPException(status_code=404, detail="No photo")
    if data_url.startswith("data:"):
        header, encoded = data_url.split(",", 1)
        mime = header.split(":")[1].split(";")[0]  # e.g. "image/jpeg"
        image_bytes = base64.b64decode(encoded)
    else:
        # Already a URL – redirect the browser to it
        from fastapi.responses import RedirectResponse
        return RedirectResponse(data_url)
    return Response(
        content=image_bytes,
        media_type=mime,
        headers={"Cache-Control": "public, max-age=3600"},  # 1-hour browser cache
    )


@router.get("/api/users/{user_id}/photo", include_in_schema=False)
def get_user_photo(user_id: int, db: Session = Depends(get_db)):
    """Returns the user's profile photo as a proper image (browser-cacheable)."""
    row = db.query(models.User.profile_photo).filter(models.User.id == user_id).first()
    return _photo_response(row.profile_photo if row else None)


@router.get("/marketplace/posts/{post_id}/photo", include_in_schema=False)
def get_post_author_photo(post_id: int, db: Session = Depends(get_db)):
    """Returns the marketplace post author's photo as a proper image (browser-cacheable)."""
    row = db.query(models.MarketplacePost.profile_photo).filter(models.MarketplacePost.id == post_id).first()
    return _photo_response(row.profile_photo if row else None)


@router.post("/marketplace", response_model=schemas.MarketplaceResponse)
def create_marketplace_post(
    post: schemas.MarketplaceCreate,
    db: Session = Depends(get_db)
):
    global _marketplace_cache
    result = crud.create_post(db, post)
    _marketplace_cache = None  # invalidate so next GET fetches fresh data
    return result


@router.get("/marketplace", response_model=list[schemas.MarketplaceListItem])
def get_marketplace_posts(
    db: Session = Depends(get_db)
):
    global _marketplace_cache

    # ── Cache check ────────────────────────────────────────────────────────────
    if _marketplace_cache is not None:
        ts, data = _marketplace_cache
        if time.monotonic() - ts < _MARKETPLACE_TTL:
            return data

    # Select all columns EXCEPT profile_photo (which may be a 300KB+ base64
    # blob stored directly in the DB, causing very slow fetches from Neon).
    # The photo is now served via /marketplace/posts/{id}/photo instead.
    cols = (
        models.MarketplacePost.id,
        models.MarketplacePost.user_id,
        models.MarketplacePost.user_role,
        models.MarketplacePost.full_name,
        models.MarketplacePost.product_name,
        models.MarketplacePost.variety,
        models.MarketplacePost.quantity,
        models.MarketplacePost.unit,
        models.MarketplacePost.price,
        models.MarketplacePost.price_discussion,
        models.MarketplacePost.harvest_date,
        models.MarketplacePost.availability,
        models.MarketplacePost.organic,
        models.MarketplacePost.district,
        models.MarketplacePost.municipality,
        models.MarketplacePost.latitude,
        models.MarketplacePost.longitude,
        models.MarketplacePost.delivery_method,
        models.MarketplacePost.description,
        models.MarketplacePost.image,
        models.MarketplacePost.created_at,
        (models.MarketplacePost.profile_photo != None).label("has_author_photo"),
    )
    rows = db.query(*cols).order_by(models.MarketplacePost.id.desc()).all()
    posts = [
        schemas.MarketplaceListItem(
            id=r.id,
            user_role=r.user_role,
            full_name=r.full_name,
            product_name=r.product_name,
            variety=r.variety,
            quantity=r.quantity,
            unit=r.unit,
            price=r.price,
            price_discussion=r.price_discussion,
            harvest_date=r.harvest_date,
            availability=r.availability,
            organic=r.organic,
            district=r.district,
            municipality=r.municipality,
            delivery_method=r.delivery_method,
            description=r.description,
            image=r.image,
            created_at=r.created_at,
            has_author_photo=bool(r.has_author_photo),
        )
        for r in rows
    ]

    # ── Cache write ────────────────────────────────────────────────────────────
    _marketplace_cache = (time.monotonic(), posts)
    return posts


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
        description=payload.description,
        years_experience=payload.years_experience,
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
        description=user.description,
        years_experience=user.years_experience,
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
        description=user.description,
        years_experience=user.years_experience,
    )
    return schemas.TokenResponse(access_token=token, user=user_out)


@router.put("/api/users/me", response_model=schemas.UserOut)
def update_current_user(
    payload: schemas.ProfileUpdateRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid bearer token")

    try:
        token = authorization.split(" ", 1)[1]
        claims = decode_access_token(token)
        user_id = int(claims.get("sub"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.mobile is not None:
        user.mobile = payload.mobile.strip()
    if payload.email is not None:
        user.email = payload.email
    if payload.address is not None:
        user.address = payload.address.strip()
    if payload.location is not None:
        user.location = payload.location.strip()
    if payload.profile_photo is not None:
        user.profile_photo = payload.profile_photo
    if payload.description is not None:
        user.description = payload.description.strip() or None
    if payload.years_experience is not None:
        user.years_experience = payload.years_experience

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Mobile number or email already exists")

    return schemas.UserOut(
        id=user.id,
        full_name=user.full_name,
        mobile=user.mobile,
        email=user.email,
        role=user.role.value,
        is_verified=user.is_verified,
        address=user.address,
        location=user.location,
        profile_photo=user.profile_photo,
        description=user.description,
        years_experience=user.years_experience,
    )


@router.get("/api/users", response_model=list[schemas.DirectoryUserOut])
def get_people(role: str | None = None, db: Session = Depends(get_db)):
    """Public marketplace directory; deliberately excludes mobile, email, address,
    and the (potentially very large) profile_photo blob – only lightweight fields
    are fetched so the query stays fast even over a remote Neon connection.

    Results are cached in-memory for 30 seconds so repeated visits are instant.
    """

    # ── Cache check ────────────────────────────────────────────────────────────
    cached = _directory_cache.get(role)
    if cached is not None:
        ts, data = cached
        if time.monotonic() - ts < _DIRECTORY_TTL:
            return data


    # Select only the lightweight columns we actually need for directory cards.
    # Crucially, profile_photo is intentionally omitted here because users may
    # store base64-encoded images (100KB+) that balloon the payload and cause
    # the query to be slow when fetched over the network from Neon (US-East-2).
    user_cols = (
        models.User.id,
        models.User.full_name,
        models.User.role,
        models.User.location,
        models.User.description,
        models.User.years_experience,
        models.User.is_verified,
        models.User.created_at,
        (models.User.profile_photo != None).label("has_photo"),
    )

    query = db.query(*user_cols)
    if role in ("farmer", "broker"):
        query = query.filter(models.User.role == models.UserRole(role))
    query = query.order_by(models.User.created_at.desc())
    rows = query.all()

    if not rows:
        return []

    # Fetch the relevant profile table in a single query using an IN clause.
    user_ids = [r.id for r in rows]
    role_filter = models.UserRole(role) if role in ("farmer", "broker") else None

    farmer_map: dict = {}
    broker_map: dict = {}

    if role_filter is None or role_filter == models.UserRole.farmer:
        farmer_rows = (
            db.query(
                models.FarmerProfile.user_id,
                models.FarmerProfile.harvest_scale,
                models.FarmerProfile.crops,
            )
            .filter(models.FarmerProfile.user_id.in_(user_ids))
            .all()
        )
        farmer_map = {r.user_id: r for r in farmer_rows}

    if role_filter is None or role_filter == models.UserRole.broker:
        broker_rows = (
            db.query(
                models.BrokerProfile.user_id,
                models.BrokerProfile.trading_scale,
                models.BrokerProfile.transport,
                models.BrokerProfile.crops,
            )
            .filter(models.BrokerProfile.user_id.in_(user_ids))
            .all()
        )
        broker_map = {r.user_id: r for r in broker_rows}

    people = []
    for u in rows:
        is_farmer = u.role == models.UserRole.farmer
        fp = farmer_map.get(u.id)
        bp = broker_map.get(u.id)
        profile = fp if is_farmer else bp
        people.append(schemas.DirectoryUserOut(
            id=u.id,
            full_name=u.full_name,
            role=u.role.value,
            location=u.location,
            has_photo=bool(u.has_photo),
            description=u.description,
            years_experience=u.years_experience,
            is_verified=u.is_verified,
            crops=(profile.crops or []) if profile else [],
            scale=(fp.harvest_scale if is_farmer else bp.trading_scale) if profile else None,
            transport=bp.transport if (not is_farmer and bp) else None,
        ))

    # ── Cache write ────────────────────────────────────────────────────────────
    _directory_cache[role] = (time.monotonic(), people)
    return people
