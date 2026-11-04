"""
ai_surveillance/backend/main.py
FastAPI entry point for the AI Surveillance & Emergency SOS System.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from ai_surveillance.config.settings import settings
from ai_surveillance.backend.database.connection import init_db
from ai_surveillance.backend.routers import incidents, cameras, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database tables and verify storage directories
    print("[Surveillance System]: Initializing PostgreSQL & Evidence Storage...")
    await init_db()
    settings.IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    settings.VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    print("[Surveillance System]: Ready to process live CCTV camera feeds.")
    yield
    # Shutdown
    print("[Surveillance System]: Shutting down stream processing engine.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Evidence Media Directory for Secure Static Playback / Download
app.mount("/evidence/images", StaticFiles(directory=str(settings.IMAGES_DIR)), name="evidence_images")
app.mount("/evidence/videos", StaticFiles(directory=str(settings.VIDEOS_DIR)), name="evidence_videos")

# Register Routers
app.include_router(incidents.router)
app.include_router(cameras.router)
app.include_router(ws.router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "ai_surveillance.backend.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )

