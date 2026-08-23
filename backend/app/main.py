import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base, SessionLocal, init_db_schema
from app.seed import seed_database
from app.routers import (
    auth_router,
    complaints_router,
    notices_router,
    dashboard_router,
    settings_router,
    admin_router,
    staff_router,
    notifications_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and apply schema migrations
    init_db_schema()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown: Clean up if needed

app = FastAPI(
    title="Homely - Society Maintenance Complaint Tracker API",
    description="Full-stack complaint lifecycle tracking, photo management, notice board, and overdue detection API.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for easy dev and deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for photo hosting
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(notices_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(staff_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": "Homely - Society Maintenance Complaint Tracker API",
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_STR
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
