"""
Model metrics API routes — exposes model performance data to the frontend.
"""
import json
import logging
from fastapi import APIRouter
from backend.app.config import METRICS_DIR

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["metrics"])


def load_metrics_file(filename: str) -> dict:
    """Load a metrics JSON file."""
    path = METRICS_DIR / filename
    if not path.exists():
        return {}
    try:
        with open(path) as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to load metrics from %s: %s", path, e)
        return {}


@router.get("/model-metrics")
async def model_metrics():
    """Get all model evaluation metrics."""
    regression = load_metrics_file("regression.json")
    classifier = load_metrics_file("classifier.json")
    timeseries = load_metrics_file("timeseries.json")

    return {
        "regression": regression,
        "classification": classifier,
        "timeseries": timeseries,
    }
