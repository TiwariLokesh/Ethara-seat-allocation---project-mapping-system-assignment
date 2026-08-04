import ssl
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# SSL/connect args are only valid for the asyncpg (PostgreSQL) driver.
# aiosqlite (used locally) doesn't accept "ssl" or "command_timeout".
if settings.DATABASE_URL.startswith("postgresql"):
    ssl_context = ssl.create_default_context()
    connect_args = {
        "ssl": ssl_context,
        "command_timeout": 10,
    }
else:
    connect_args = {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # True only for debugging
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()