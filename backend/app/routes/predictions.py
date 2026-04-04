"""
ML prediction API routes.
"""
import logging
from fastapi import APIRouter, HTTPException
from backend.app.schemas import PredictionInput, TrajectoryInput
from backend.app.ml.inference import value_predictor, trajectory_classifier, timeseries_forecaster
from backend.app.data.loader import data_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["predictions"])


@router.post("/predict-value")
async def predict_value(input_data: PredictionInput):
    """Predict market value based on player features."""
    try:
        result = value_predictor.predict(input_data.model_dump())
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Prediction error: %s", e)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict-trajectory")
async def predict_trajectory(input_data: TrajectoryInput):
    """Classify career trajectory based on player features."""
    try:
        result = trajectory_classifier.predict(input_data.model_dump())
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Trajectory classification error: %s", e)
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.get("/player-forecast/{player_id}")
async def player_forecast(player_id: int, n_years: int = 5):
    """Forecast future values for a specific player."""
    try:
        player = data_store.get_player_by_id(player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")

        history = data_store.get_player_value_history(player_id)
        if len(history) < 3:
            return {
                "player_id": player_id,
                "forecasts": [],
                "message": "Insufficient history data for forecasting (need at least 3 data points)."
            }

        current_age = int(player.get('age', 25))
        forecasts = timeseries_forecaster.forecast(history, current_age, n_years)

        return {
            "player_id": player_id,
            "player_name": player.get('name', 'Unknown'),
            "current_age": current_age,
            "current_value": player.get('current_value_eur', 0),
            "forecasts": forecasts,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Forecast error for player %d: %s", player_id, e)
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")
