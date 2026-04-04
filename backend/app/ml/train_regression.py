"""
Market Value Regression Training — LightGBM, XGBoost, Random Forest.
Trains all three models, evaluates, logs to MLflow, and saves the best.
"""
import os
import json
import logging
import numpy as np
import joblib
import mlflow
import mlflow.sklearn
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import lightgbm as lgb
import xgboost as xgb

from backend.app.config import (
    MLFLOW_TRACKING_URI, MLFLOW_EXPERIMENT_REGRESSION,
    REGRESSION_MODEL_DIR, METRICS_DIR
)
from backend.app.ml.feature_engineering import prepare_regression_data, REGRESSION_FEATURES

logger = logging.getLogger(__name__)


def train_regression():
    """Train all regression models, compare, and save the best."""
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(MLFLOW_EXPERIMENT_REGRESSION)

    X, y, y_log, df = prepare_regression_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y_log, test_size=0.2, random_state=42)

    # Also keep non-log y for evaluation
    _, _, y_train_raw, y_test_raw = train_test_split(X, y, test_size=0.2, random_state=42)

    models = {
        'LightGBM': lgb.LGBMRegressor(
            n_estimators=300, learning_rate=0.05, max_depth=6,
            num_leaves=31, subsample=0.8, colsample_bytree=0.8,
            random_state=42, verbose=-1
        ),
        'XGBoost': xgb.XGBRegressor(
            n_estimators=300, learning_rate=0.05, max_depth=6,
            subsample=0.8, colsample_bytree=0.8,
            random_state=42, verbosity=0
        ),
        'RandomForest': RandomForestRegressor(
            n_estimators=200, max_depth=10, min_samples_split=5,
            random_state=42, n_jobs=-1
        ),
    }

    best_model = None
    best_model_name = None
    best_r2 = -float('inf')
    all_metrics = {}

    for name, model in models.items():
        logger.info("Training %s regression model...", name)

        with mlflow.start_run(run_name=f"regression-{name}"):
            model.fit(X_train, y_train)

            # Predict (reverse log transform)
            y_pred_log = model.predict(X_test)
            y_pred = np.expm1(y_pred_log)
            y_actual = y_test_raw.values

            # Metrics
            mae = mean_absolute_error(y_actual, y_pred)
            rmse = np.sqrt(mean_squared_error(y_actual, y_pred))
            r2 = r2_score(y_actual, y_pred)

            # Cross-validation R2
            cv_scores = cross_val_score(model, X, y_log, cv=5, scoring='r2')
            cv_r2_mean = cv_scores.mean()

            logger.info("%s — MAE: %.0f, RMSE: %.0f, R2: %.4f, CV-R2: %.4f",
                        name, mae, rmse, r2, cv_r2_mean)

            # Feature importance
            if hasattr(model, 'feature_importances_'):
                importance = dict(zip(REGRESSION_FEATURES, model.feature_importances_.tolist()))
            else:
                importance = {}

            # Log to MLflow
            mlflow.log_params({
                "model_type": name,
                "n_features": len(REGRESSION_FEATURES),
                "train_size": len(X_train),
                "test_size": len(X_test),
            })
            mlflow.log_metrics({
                "mae": mae, "rmse": rmse, "r2": r2, "cv_r2_mean": cv_r2_mean,
            })
            mlflow.sklearn.log_model(model, f"model-{name}")

            all_metrics[name] = {
                "model_name": name,
                "model_type": "regression",
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "r2": round(r2, 4),
                "cv_r2_mean": round(cv_r2_mean, 4),
                "feature_importances": {k: round(v, 4) for k, v in importance.items()},
            }

            if r2 > best_r2:
                best_r2 = r2
                best_model = model
                best_model_name = name

    # Save best model
    os.makedirs(REGRESSION_MODEL_DIR, exist_ok=True)
    model_path = REGRESSION_MODEL_DIR / "best_model.joblib"
    joblib.dump(best_model, model_path)
    logger.info("Best regression model: %s (R2=%.4f), saved to %s", best_model_name, best_r2, model_path)

    # Save metrics
    os.makedirs(METRICS_DIR, exist_ok=True)
    metrics_path = METRICS_DIR / "regression.json"
    with open(metrics_path, 'w') as f:
        json.dump({"best_model": best_model_name, "models": all_metrics}, f, indent=2)

    return best_model, all_metrics


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_regression()
