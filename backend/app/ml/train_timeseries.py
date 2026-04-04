"""
Time Series Value Forecasting using LightGBM on lag features.
Predicts future player values based on historical valuation patterns.
"""
import os
import json
import logging
import numpy as np
import joblib
import mlflow
import mlflow.sklearn
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import lightgbm as lgb

from backend.app.config import (
    MLFLOW_TRACKING_URI, MLFLOW_EXPERIMENT_TIMESERIES,
    TIMESERIES_MODEL_DIR, METRICS_DIR
)
from backend.app.ml.feature_engineering import prepare_timeseries_data

logger = logging.getLogger(__name__)

TS_FEATURES = [
    'value_lag_1', 'value_lag_2', 'value_lag_3',
    'value_rolling_avg_3', 'value_rolling_std_3', 'value_pct_change',
    'age_at_date', 'months_since_first'
]


def train_timeseries():
    """Train time series forecasting model."""
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(MLFLOW_EXPERIMENT_TIMESERIES)

    X, y, ts_df = prepare_timeseries_data()

    if X.empty:
        logger.warning("No time series data available for training.")
        return None, {}

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = lgb.LGBMRegressor(
        n_estimators=300, learning_rate=0.05, max_depth=8,
        num_leaves=31, subsample=0.8, colsample_bytree=0.8,
        random_state=42, verbose=-1
    )

    with mlflow.start_run(run_name="timeseries-lgbm"):
        logger.info("Training time series LightGBM model...")
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)

        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        logger.info("TimeSeries — MAE: %.0f, RMSE: %.0f, R2: %.4f", mae, rmse, r2)

        importance = dict(zip(TS_FEATURES, model.feature_importances_.tolist()))

        mlflow.log_params({"model_type": "LightGBM", "task": "timeseries"})
        mlflow.log_metrics({"mae": mae, "rmse": rmse, "r2": r2})
        mlflow.sklearn.log_model(model, "timeseries-model")

    # Save model
    os.makedirs(TIMESERIES_MODEL_DIR, exist_ok=True)
    joblib.dump(model, TIMESERIES_MODEL_DIR / "best_model.joblib")

    metrics = {
        "LightGBM": {
            "model_name": "LightGBM",
            "model_type": "timeseries",
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(r2, 4),
            "feature_importances": {k: round(v, 4) for k, v in importance.items()},
        }
    }

    os.makedirs(METRICS_DIR, exist_ok=True)
    with open(METRICS_DIR / "timeseries.json", 'w') as f:
        json.dump({"best_model": "LightGBM", "models": metrics}, f, indent=2)

    return model, metrics


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_timeseries()
