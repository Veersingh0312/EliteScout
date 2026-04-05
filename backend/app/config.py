"""
Application configuration — paths, constants, and environment settings.
"""
import os
from pathlib import Path

# Project root (football-mlops/)
PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
METRICS_DIR = PROJECT_ROOT / "metrics"
MLRUNS_DIR = PROJECT_ROOT / "mlruns"

# Dataset paths
PLAYER_VALUES_CSV = DATA_DIR / "transfermarkt_player_values.csv"
VALUE_HISTORY_CSV = DATA_DIR / "transfermarkt_value_history.csv"

# Model paths
REGRESSION_MODEL_DIR = MODELS_DIR / "regression"
CLASSIFIER_MODEL_DIR = MODELS_DIR / "classifier"
TIMESERIES_MODEL_DIR = MODELS_DIR / "timeseries"

# MLflow (Defaults to the local Docker-mapped port 5050)
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5050")
MLFLOW_EXPERIMENT_REGRESSION = "market-value-regression"
MLFLOW_EXPERIMENT_CLASSIFIER = "trajectory-classification"
MLFLOW_EXPERIMENT_TIMESERIES = "value-timeseries"

# Transfermarkt player image URL template
PLAYER_IMAGE_URL = "https://img.a.transfermarkt.technology/portrait/big/{player_id}.jpg"

# API Settings
API_PREFIX = "/api"
CORS_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
    "http://localhost:8000",
    "*",
]
