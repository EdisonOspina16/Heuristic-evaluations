from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# We use the DATABASE_URL construction or the direct one from .env
# Note: psycopg2 expects the postgresql:// prefix
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/heuristic_db")

# Some simple string replacement if needed to ensure the dialect is correct
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
