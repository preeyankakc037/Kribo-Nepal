import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.database import Base, engine
from app.routes import router

Base.metadata.create_all(bind=engine)

# Keep existing local development databases compatible with the new user avatar.
if "profile_photo" not in {column["name"] for column in inspect(engine).get_columns("users")}:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN profile_photo TEXT"))

app = FastAPI(
    title="Kribo Nepal Marketplace API",
    description="🌾 Transparent Digital Marketplace API for Farmers and Brokers in Nepal."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
