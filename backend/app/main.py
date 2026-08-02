import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.database import Base, engine
from app.routes import router
from app.kalimati_price_scraper import kalimati_router

Base.metadata.create_all(bind=engine)

# Keep existing local development databases compatible with the newer profile fields.
existing_columns = {column["name"] for column in inspect(engine).get_columns("users")}
if "profile_photo" not in existing_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN profile_photo TEXT"))
if "description" not in existing_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN description TEXT"))
if "years_experience" not in existing_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN years_experience INTEGER"))

existing_mp_columns = {column["name"] for column in inspect(engine).get_columns("marketplace_posts")}
if "profile_photo" not in existing_mp_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE marketplace_posts ADD COLUMN profile_photo TEXT"))
if "user_id" not in existing_mp_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE marketplace_posts ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE"))
if "latitude" not in existing_mp_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE marketplace_posts ADD COLUMN latitude TEXT"))
if "longitude" not in existing_mp_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE marketplace_posts ADD COLUMN longitude TEXT"))

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
app.include_router(kalimati_router)
