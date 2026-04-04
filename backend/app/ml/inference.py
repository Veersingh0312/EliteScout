"""
Model inference/serving module.
Loads trained models and provides prediction functions for the API.
"""
import os
import json
import logging
import numpy as np
import pandas as pd
import joblib
from typing import Optional

from backend.app.config import (
    REGRESSION_MODEL_DIR, CLASSIFIER_MODEL_DIR, TIMESERIES_MODEL_DIR,
    METRICS_DIR, DATA_DIR
)
from backend.app.ml.feature_engineering import (
    REGRESSION_FEATURES, CLASSIFIER_FEATURES, TRAJECTORY_CLASSES
)

logger = logging.getLogger(__name__)

PROCESSED_DIR = DATA_DIR / "processed"


class ValuePredictor:
    """Predicts market value using the best regression model."""

    def __init__(self):
        self._model = None
        self._encoders = None

    def _load(self):
        model_path = REGRESSION_MODEL_DIR / "best_model.joblib"
        if not model_path.exists():
            raise FileNotFoundError(f"Regression model not found at {model_path}. Run training first.")
        self._model = joblib.load(model_path)

        encoder_path = PROCESSED_DIR / "encoders.json"
        if encoder_path.exists():
            with open(encoder_path) as f:
                self._encoders = json.load(f)
        logger.info("Regression model loaded successfully.")

    @property
    def model(self):
        if self._model is None:
            self._load()
        return self._model

    @property
    def encoders(self):
        if self._encoders is None:
            self._load()
        return self._encoders

    def encode_category(self, value: str, category_type: str) -> int:
        """Encode a categorical value using saved label encoder classes."""
        key = f"{category_type}_classes"
        classes = self.encoders.get(key, [])
        if value in classes:
            return classes.index(value)
        return 0  # Default to first class if unknown

    def predict(self, input_data: dict) -> dict:
        """Predict market value from input features."""
        # Encode categoricals
        position_encoded = self.encode_category(input_data.get('position_group', 'Other'), 'position_group')
        league_encoded = self.encode_category(input_data.get('league_name', 'Other'), 'league_name')

        features = {
            'age': input_data.get('age', 25),
            'career_span_years': input_data.get('career_span_years', 5),
            'value_cagr': input_data.get('value_cagr', 0.5),
            'value_multiplier_x': input_data.get('value_multiplier_x', 2.0),
            'value_volatility': input_data.get('value_volatility', 0.5),
            'age_at_peak': input_data.get('age_at_peak', 27),
            'peak_value_eur': input_data.get('peak_value_eur', 50000000),
            'years_to_peak': input_data.get('years_to_peak', 5.0),
            'num_clubs_career': input_data.get('num_clubs_career', 3),
            'mean_yoy_growth_rate': input_data.get('mean_yoy_growth_rate', 0.1),
            'num_valuation_points': input_data.get('num_valuation_points', 10),
            'position_group_encoded': position_encoded,
            'league_name_encoded': league_encoded,
        }

        df = pd.DataFrame([features])[REGRESSION_FEATURES]
        pred_log = self.model.predict(df)[0]
        pred_value = float(np.expm1(pred_log))
        pred_value = max(0, pred_value)

        # Feature importance
        importances = {}
        if hasattr(self.model, 'feature_importances_'):
            importances = dict(zip(REGRESSION_FEATURES, 
                                   [round(float(x), 4) for x in self.model.feature_importances_]))

        return {
            "predicted_value": round(pred_value, 2),
            "predicted_value_formatted": format_currency(pred_value),
            "model_used": type(self.model).__name__,
            "feature_importances": importances,
        }


class TrajectoryClassifier:
    """Classifies player career trajectory."""

    def __init__(self):
        self._model = None
        self._le = None
        self._encoders = None

    def _load(self):
        model_path = CLASSIFIER_MODEL_DIR / "best_model.joblib"
        le_path = CLASSIFIER_MODEL_DIR / "label_encoder.joblib"
        if not model_path.exists():
            raise FileNotFoundError(f"Classifier model not found at {model_path}. Run training first.")
        self._model = joblib.load(model_path)
        if le_path.exists():
            self._le = joblib.load(le_path)

        encoder_path = PROCESSED_DIR / "encoders.json"
        if encoder_path.exists():
            with open(encoder_path) as f:
                self._encoders = json.load(f)
        logger.info("Classifier model loaded successfully.")

    @property
    def model(self):
        if self._model is None:
            self._load()
        return self._model

    @property
    def label_encoder(self):
        if self._le is None:
            self._load()
        return self._le

    @property
    def encoders(self):
        if self._encoders is None:
            self._load()
        return self._encoders

    def encode_category(self, value: str, category_type: str) -> int:
        key = f"{category_type}_classes"
        classes = self.encoders.get(key, [])
        if value in classes:
            return classes.index(value)
        return 0

    def predict(self, input_data: dict) -> dict:
        """Classify trajectory from input features."""
        position_encoded = self.encode_category(input_data.get('position_group', 'Other'), 'position_group')
        league_encoded = self.encode_category(input_data.get('league_name', 'Other'), 'league_name')

        features = {
            'age': input_data.get('age', 25),
            'career_span_years': input_data.get('career_span_years', 5),
            'value_cagr': input_data.get('value_cagr', 0.5),
            'value_multiplier_x': input_data.get('value_multiplier_x', 2.0),
            'value_volatility': input_data.get('value_volatility', 0.5),
            'age_at_peak': input_data.get('age_at_peak', 27),
            'peak_value_eur': input_data.get('peak_value_eur', 50000000),
            'years_to_peak': input_data.get('years_to_peak', 5.0),
            'num_clubs_career': input_data.get('num_clubs_career', 3),
            'mean_yoy_growth_rate': input_data.get('mean_yoy_growth_rate', 0.1),
            'num_valuation_points': input_data.get('num_valuation_points', 10),
            'position_group_encoded': position_encoded,
            'league_name_encoded': league_encoded,
            'post_peak_decline_pct': input_data.get('post_peak_decline_pct', 0),
            'is_at_peak': input_data.get('is_at_peak', 0),
            'value_to_peak_cagr': input_data.get('value_to_peak_cagr', 0.5),
        }

        df = pd.DataFrame([features])[CLASSIFIER_FEATURES]
        pred_encoded = self.model.predict(df)[0]

        # Get class name
        if self.label_encoder:
            pred_class = self.label_encoder.inverse_transform([pred_encoded])[0]
        else:
            pred_class = TRAJECTORY_CLASSES[int(pred_encoded)] if int(pred_encoded) < len(TRAJECTORY_CLASSES) else "unknown"

        # Probabilities
        probabilities = {}
        if hasattr(self.model, 'predict_proba'):
            proba = self.model.predict_proba(df)[0]
            for i, cls in enumerate(TRAJECTORY_CLASSES):
                if i < len(proba):
                    probabilities[cls] = round(float(proba[i]), 4)

        confidence = max(probabilities.values()) if probabilities else 0.0

        return {
            "predicted_trajectory": pred_class,
            "confidence": round(confidence, 4),
            "probabilities": probabilities,
        }


class TimeSeriesForecaster:
    """Forecasts future player values using time series model."""

    def __init__(self):
        self._model = None

    def _load(self):
        model_path = TIMESERIES_MODEL_DIR / "best_model.joblib"
        if not model_path.exists():
            raise FileNotFoundError(f"Time series model not found at {model_path}.")
        self._model = joblib.load(model_path)
        logger.info("Time series model loaded successfully.")

    @property
    def model(self):
        if self._model is None:
            self._load()
        return self._model

    def forecast(self, value_history: list[dict], current_age: int, n_years: int = 5) -> list[dict]:
        """Forecast future values based on a player's history."""
        if len(value_history) < 3:
            return []

        # Sort and extract values
        history = sorted(value_history, key=lambda x: x.get('valuation_date', ''))
        values = [h['value_eur'] for h in history]

        forecasts = []
        current_values = list(values)
        current_age_now = current_age

        for year_offset in range(1, n_years + 1):
            # Build features from current state
            v1 = current_values[-1] if len(current_values) >= 1 else 0
            v2 = current_values[-2] if len(current_values) >= 2 else v1
            v3 = current_values[-3] if len(current_values) >= 3 else v2

            rolling_avg = np.mean(current_values[-3:])
            rolling_std = np.std(current_values[-3:]) if len(current_values) >= 3 else 0
            pct_change = (v1 - v2) / v2 if v2 != 0 else 0

            features = pd.DataFrame([{
                'value_lag_1': v1,
                'value_lag_2': v2,
                'value_lag_3': v3,
                'value_rolling_avg_3': rolling_avg,
                'value_rolling_std_3': rolling_std,
                'value_pct_change': pct_change,
                'age_at_date': current_age_now + year_offset,
                'months_since_first': len(current_values) * 6 + year_offset * 12,
            }])

            pred = float(self.model.predict(features)[0])
            pred = max(0, pred)

            forecasts.append({
                "year": year_offset,
                "age": current_age_now + year_offset,
                "predicted_value": round(pred, 2),
                "is_forecast": True,
            })

            current_values.append(pred)

        return forecasts


def format_currency(value: float) -> str:
    """Format a number as a readable currency string."""
    if value >= 1_000_000:
        return f"€{value/1_000_000:.1f}M"
    elif value >= 1_000:
        return f"€{value/1_000:.0f}K"
    else:
        return f"€{value:.0f}"


# Module-level singleton instances
value_predictor = ValuePredictor()
trajectory_classifier = TrajectoryClassifier()
timeseries_forecaster = TimeSeriesForecaster()
