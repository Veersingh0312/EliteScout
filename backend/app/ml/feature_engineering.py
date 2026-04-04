"""
Feature engineering for Transfermarkt datasets.
Prepares data for regression, classification, and time series models.
"""
import pandas as pd
import numpy as np
import json
import os
import logging
from sklearn.preprocessing import LabelEncoder
from backend.app.config import PLAYER_VALUES_CSV, VALUE_HISTORY_CSV, DATA_DIR

logger = logging.getLogger(__name__)

PROCESSED_DIR = DATA_DIR / "processed"

# Feature columns for regression
REGRESSION_FEATURES = [
    'age', 'career_span_years', 'value_cagr', 'value_multiplier_x',
    'value_volatility', 'age_at_peak', 'peak_value_eur', 'years_to_peak',
    'num_clubs_career', 'mean_yoy_growth_rate', 'num_valuation_points',
    'position_group_encoded', 'league_name_encoded',
]

REGRESSION_TARGET = 'current_value_eur'

# Feature columns for classification
CLASSIFIER_FEATURES = REGRESSION_FEATURES + [
    'post_peak_decline_pct', 'is_at_peak', 'value_to_peak_cagr',
]

CLASSIFIER_TARGET = 'trajectory'

# Trajectory classes
TRAJECTORY_CLASSES = ['rising_star', 'growing', 'stable', 'declining', 'falling_sharply']


def prepare_regression_data():
    """Prepare features and targets for market value regression."""
    logger.info("Preparing regression data...")
    df = pd.read_csv(PLAYER_VALUES_CSV)

    # Clean and convert
    numeric_cols = [
        'current_value_eur', 'peak_value_eur', 'first_value_eur', 'last_value_eur',
        'age', 'age_at_peak', 'career_span_years', 'years_to_peak',
        'value_cagr', 'value_to_peak_cagr', 'value_multiplier_x',
        'post_peak_decline_pct', 'value_volatility', 'mean_yoy_growth_rate',
        'num_valuation_points', 'num_clubs_career'
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    df = df.dropna(subset=[REGRESSION_TARGET])

    # Encode categoricals
    le_position = LabelEncoder()
    le_league = LabelEncoder()

    df['position_group'] = df['position_group'].fillna('Other')
    df['league_name'] = df['league_name'].fillna('Other')

    df['position_group_encoded'] = le_position.fit_transform(df['position_group'])
    df['league_name_encoded'] = le_league.fit_transform(df['league_name'])

    # Fill NaN in feature columns
    for col in REGRESSION_FEATURES:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())

    # Save encoders info
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    encoder_info = {
        'position_group_classes': le_position.classes_.tolist(),
        'league_name_classes': le_league.classes_.tolist(),
    }
    with open(PROCESSED_DIR / 'encoders.json', 'w') as f:
        json.dump(encoder_info, f, indent=2)

    X = df[REGRESSION_FEATURES].copy()
    y = df[REGRESSION_TARGET].copy()

    # Log-transform target for better regression performance
    y_log = np.log1p(y)

    logger.info("Regression data prepared: X=%s, y=%s", X.shape, y.shape)
    return X, y, y_log, df


def prepare_classifier_data():
    """Prepare features and targets for trajectory classification."""
    logger.info("Preparing classification data...")
    df = pd.read_csv(PLAYER_VALUES_CSV)

    numeric_cols = [
        'current_value_eur', 'peak_value_eur', 'age', 'age_at_peak',
        'career_span_years', 'years_to_peak', 'value_cagr', 'value_to_peak_cagr',
        'value_multiplier_x', 'post_peak_decline_pct', 'value_volatility',
        'mean_yoy_growth_rate', 'num_valuation_points', 'num_clubs_career'
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    df = df.dropna(subset=[CLASSIFIER_TARGET])
    df['trajectory'] = df['trajectory'].fillna('stable')

    # Encode categoricals
    le_position = LabelEncoder()
    le_league = LabelEncoder()
    le_trajectory = LabelEncoder()

    df['position_group'] = df['position_group'].fillna('Other')
    df['league_name'] = df['league_name'].fillna('Other')

    df['position_group_encoded'] = le_position.fit_transform(df['position_group'])
    df['league_name_encoded'] = le_league.fit_transform(df['league_name'])

    # Encode target
    le_trajectory.fit(TRAJECTORY_CLASSES)
    df = df[df['trajectory'].isin(TRAJECTORY_CLASSES)]
    df['trajectory_encoded'] = le_trajectory.transform(df['trajectory'])

    # Fill NaN
    for col in CLASSIFIER_FEATURES:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())

    X = df[CLASSIFIER_FEATURES].copy()
    y = df['trajectory_encoded'].copy()

    logger.info("Classification data prepared: X=%s, y=%s, classes=%s", X.shape, y.shape, TRAJECTORY_CLASSES)
    return X, y, le_trajectory, df


def prepare_timeseries_data():
    """Prepare time series features from value history for forecasting."""
    logger.info("Preparing time series data...")
    df = pd.read_csv(VALUE_HISTORY_CSV)
    df['valuation_date'] = pd.to_datetime(df['valuation_date'], format='%d/%m/%Y', errors='coerce')
    df['value_eur'] = pd.to_numeric(df['value_eur'], errors='coerce')
    df = df.dropna(subset=['value_eur', 'valuation_date'])
    df = df.sort_values(['player_id', 'valuation_date']).reset_index(drop=True)

    # Create lag features per player
    features_list = []

    for pid, group in df.groupby('player_id'):
        if len(group) < 3:
            continue

        group = group.sort_values('valuation_date').reset_index(drop=True)
        group['value_lag_1'] = group['value_eur'].shift(1)
        group['value_lag_2'] = group['value_eur'].shift(2)
        group['value_lag_3'] = group['value_eur'].shift(3)
        group['value_rolling_avg_3'] = group['value_eur'].rolling(3, min_periods=1).mean()
        group['value_rolling_std_3'] = group['value_eur'].rolling(3, min_periods=1).std().fillna(0)
        group['value_pct_change'] = group['value_eur'].pct_change().fillna(0)
        group['months_since_first'] = (
            (group['valuation_date'] - group['valuation_date'].iloc[0]).dt.days / 30
        ).astype(int)

        features_list.append(group.dropna(subset=['value_lag_1']))

    if not features_list:
        logger.warning("No time series data with enough history.")
        return pd.DataFrame(), pd.Series(), df

    ts_df = pd.concat(features_list, ignore_index=True)

    ts_features = [
        'value_lag_1', 'value_lag_2', 'value_lag_3',
        'value_rolling_avg_3', 'value_rolling_std_3', 'value_pct_change',
        'age_at_date', 'months_since_first'
    ]

    for col in ts_features:
        ts_df[col] = ts_df[col].fillna(0)

    X = ts_df[ts_features].copy()
    y = ts_df['value_eur'].copy()

    logger.info("Time series data prepared: X=%s, y=%s", X.shape, y.shape)
    return X, y, ts_df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    X_reg, y_reg, y_log, _ = prepare_regression_data()
    print(f"Regression: {X_reg.shape}")
    X_cls, y_cls, _, _ = prepare_classifier_data()
    print(f"Classification: {X_cls.shape}")
    X_ts, y_ts, _ = prepare_timeseries_data()
    print(f"Time Series: {X_ts.shape}")
