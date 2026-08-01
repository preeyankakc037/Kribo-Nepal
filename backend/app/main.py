from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.api.auth import router as auth_router

# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

# ── Create tables ─────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Kribo Nepal API",
    description="""
    🌾 **Kribo Nepal** — Transparent agricultural marketplace.

    Connects farmers directly with verified brokers across Nepal.
    Farmers list their harvest; brokers place their best boli.

    ## Auth
    - `POST /api/auth/register` — Create farmer or broker account
    - `POST /api/auth/login` — Login and receive a JWT token
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://localhost:5174",   # Vite fallback (when 5173 is taken)
        "http://localhost:3000",   # CRA fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)


# ── Root / health ─────────────────────────────────────────────────────────────
@app.get("/", tags=["System"])
async def root():
    return {
        "project": "Kribo Nepal",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["System"])
async def health():
    return {"status": "healthy"}
