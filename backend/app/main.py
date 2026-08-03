from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from app.config import settings

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ethara")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Seat Allocation & Project Mapping System for 5000+ employees and 5500 seats.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response time middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Custom Exception Handlers for Pydantic/Validation errors
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail, "code": exc.status_code}
    )

@app.get("/")
async def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "healthy",
        "docs": f"{settings.API_V1_STR}/docs",
        "version": settings.VERSION
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

# FastAPI API router endpoints will be mounted here
from app.api import router as api_router
from app.database import engine, Base
import asyncio

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    from app.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.models import Employee, Seat, Project
    
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Employee).limit(1))
        has_employees = res.scalar_one_or_none() is not None
        res = await session.execute(select(Seat).limit(1))
        has_seats = res.scalar_one_or_none() is not None
        res = await session.execute(select(Project).limit(1))
        has_projects = res.scalar_one_or_none() is not None
        
        if not (has_employees and has_seats and has_projects):
            import sys
            import os
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if backend_dir not in sys.path:
                sys.path.insert(0, backend_dir)
            try:
                from seed import seed_db
                await seed_db()
            except ImportError as e:
                print(f"Seed import error: {e}")
                import traceback
                traceback.print_exc()
            except Exception as e:
                print(f"Seed run error: {e}")
                import traceback
                traceback.print_exc()


app.include_router(api_router, prefix=settings.API_V1_STR)
