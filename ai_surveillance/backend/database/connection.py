"""
ai_surveillance/backend/database/connection.py
Database connection manager with async SQLAlchemy support.
Gracefully falls back to local SQLite if PostgreSQL is unavailable.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from ai_surveillance.config.settings import settings
from ai_surveillance.backend.database.models import Base

# Determine connection URL
db_url = settings.DATABASE_URL
# Convert standard postgresql:// to postgresql+asyncpg:// if necessary
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

try:
    engine = create_async_engine(db_url, echo=settings.DEBUG, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
except Exception as e:
    # Fallback to async sqlite
    print(f"[DB Warning]: PostgreSQL unavailable ({e}). Falling back to sqlite+aiosqlite.")
    sqlite_url = "sqlite+aiosqlite:///surveillance_fallback.db"
    engine = create_async_engine(sqlite_url, echo=settings.DEBUG, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """FastAPI dependency for yielding database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Creates database tables if they do not exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

