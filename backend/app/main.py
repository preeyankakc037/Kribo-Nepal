from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ============================================================
# Create FastAPI Application
# ============================================================

app = FastAPI(
    title="FarmLink API",
    description="""
    🌾 FarmLink is an AI-powered digital marketplace that connects
    farmers directly with verified brokers across Nepal.

    Features:
    - Farmer Registration
    - Broker Registration
    - Product Listing
    - Smart Product Search
    - Offer & Negotiation
    - AI Broker Recommendation
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ============================================================
# CORS Configuration
# ============================================================

origins = [
    "http://localhost:5173",  # React (Vite)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Root Endpoint
# ============================================================

@app.get("/", tags=["Home"])
async def home():
    return {
        "success": True,
        "project": "FarmLink",
        "version": "1.0.0",
        "status": "Running",
        "message": "Welcome to FarmLink API 🌾",
        "description": "Connecting Farmers and Brokers through a transparent digital marketplace.",
        "documentation": "/docs"
    }

# ============================================================
# Health Check
# ============================================================

@app.get("/health", tags=["System"])
async def health():
    return {
        "success": True,
        "status": "Healthy",
        "server": "Online"
    }

# ============================================================
# API Information
# ============================================================

@app.get("/api/info", tags=["System"])
async def api_info():
    return {
        "project": "FarmLink",
        "backend": "FastAPI",
        "frontend": "React (Vite)",
        "database": "Supabase (PostgreSQL)",
        "authentication": "Supabase Auth",
        "version": "1.0.0",
        "environment": "Development"
    }

