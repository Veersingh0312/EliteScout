"""
FastAPI Application — Football Market Value Intelligence Platform.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import CORS_ORIGINS
from backend.app.routes import players, predictions, metrics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Football Market Value Intelligence",
    description="Production-grade MLOps platform for football player market value prediction, career trajectory analysis, and value forecasting.",
    version="2.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(players.router)
app.include_router(predictions.router)
app.include_router(metrics.router)


from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os
from pathlib import Path

FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    logger.info(f"Mounting static frontend from {FRONTEND_DIST}")
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API route not found")
        index_path = FRONTEND_DIST / "index.html"
        if not index_path.exists():
            return {"error": "Frontend build not found."}
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
else:
    @app.get("/")
    async def root():
        return {
            "name": "Football Market Value Intelligence",
            "version": "2.0.0",
            "status": "running",
            "docs": "/docs",
            "note": "Frontend not built yet. Run npm run build in frontend/."
        }


@app.get("/health")
async def health():
    return {"status": "healthy"}
