from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

try:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_recycle=300,
        pool_pre_ping=False,
        connect_args={"connect_timeout": 3}
    )
    with engine.connect() as conn:
        pass
except Exception:
    # Fallback to local SQLite if PostgreSQL server is not active or times out
    engine = create_engine(
        "sqlite:///./kribo_nepal.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
