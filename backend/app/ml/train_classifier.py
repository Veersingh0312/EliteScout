"""
Career Trajectory Classification — LightGBM, XGBoost, Random Forest.
Classifies players into: rising_star, growing, stable, declining, falling_sharply.
"""
import os
import json
import logging
import numpy as np
import joblib
import mlflow
import mlflow.sklearn
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report
import lightgbm as lgb
import xgboost as xgb

from backend.app.config import (
    MLFLOW_TRACKING_URI, MLFLOW_EXPERIMENT_CLASSIFIER,
    CLASSIFIER_MODEL_DIR, METRICS_DIR
)
from backend.app.ml.feature_engineering import (
    prepare_classifier_data, CLASSIFIER_FEATURES, TRAJECTORY_CLASSES
)

logger = logging.getLogger(__name__)


def train_classifier():
    """Train trajectory classification models."""
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(MLFLOW_EXPERIMENT_CLASSIFIER)

    X, y, le_trajectory, df = prepare_classifier_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    num_classes = len(TRAJECTORY_CLASSES)

    models = {
        'LightGBM': lgb.LGBMClassifier(
            n_estimators=200, learning_rate=0.05, max_depth=6,
            num_leaves=31, num_class=num_classes,
            random_state=42, verbose=-1
        ),
        'XGBoost': xgb.XGBClassifier(
            n_estimators=200, learning_rate=0.05, max_depth=6,
            num_class=num_classes, use_label_encoder=False,
            eval_metric='mlogloss', random_state=42, verbosity=0
        ),
        'RandomForest': RandomForestClassifier(
            n_estimators=200, max_depth=10, min_samples_split=5,
            random_state=42, n_jobs=-1
        ),
    }

    best_model = None
    best_model_name = None
    best_f1 = -float('inf')
    all_metrics = {}

    for name, model in models.items():
        logger.info("Training %s classifier...", name)

        with mlflow.start_run(run_name=f"classifier-{name}"):
            model.fit(X_train, y_train)

            y_pred = model.predict(X_test)

            acc = accuracy_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred, average='weighted')
            cv_scores = cross_val_score(model, X, y, cv=5, scoring='f1_weighted')
            cv_f1_mean = cv_scores.mean()

            logger.info("%s — Accuracy: %.4f, F1: %.4f, CV-F1: %.4f",
                        name, acc, f1, cv_f1_mean)

            # Feature importance
            if hasattr(model, 'feature_importances_'):
                importance = dict(zip(CLASSIFIER_FEATURES, model.feature_importances_.tolist()))
            else:
                importance = {}

            # Log to MLflow
            mlflow.log_params({"model_type": name, "n_features": len(CLASSIFIER_FEATURES)})
            mlflow.log_metrics({"accuracy": acc, "f1_weighted": f1, "cv_f1_mean": cv_f1_mean})
            mlflow.sklearn.log_model(model, f"classifier-{name}")

            all_metrics[name] = {
                "model_name": name,
                "model_type": "classification",
                "accuracy": round(acc, 4),
                "f1_score": round(f1, 4),
                "cv_f1_mean": round(cv_f1_mean, 4),
                "feature_importances": {k: round(v, 4) for k, v in importance.items()},
            }

            if f1 > best_f1:
                best_f1 = f1
                best_model = model
                best_model_name = name

    # Save best model and label encoder
    os.makedirs(CLASSIFIER_MODEL_DIR, exist_ok=True)
    joblib.dump(best_model, CLASSIFIER_MODEL_DIR / "best_model.joblib")
    joblib.dump(le_trajectory, CLASSIFIER_MODEL_DIR / "label_encoder.joblib")
    logger.info("Best classifier: %s (F1=%.4f)", best_model_name, best_f1)

    # Save metrics
    os.makedirs(METRICS_DIR, exist_ok=True)
    with open(METRICS_DIR / "classifier.json", 'w') as f:
        json.dump({"best_model": best_model_name, "models": all_metrics}, f, indent=2)

    return best_model, all_metrics


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_classifier()
