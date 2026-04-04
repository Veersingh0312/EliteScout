# Football Market Value Intelligence Platform

An end-to-end MLOps platform for analyzing and predicting football player market values using the Transfermarkt dataset.

## Features

*   **Market Value Prediction:** Regression models (LightGBM, XGBoost, Random Forest) predict a player's current value based on age, position, career span, and historical trajectory.
*   **Trajectory Classification:** Classifies a player's career phase (rising star, growing, stable, declining) using feature-engineered historical data.
*   **Time Series Forecasting:** Predicts future market values based on lagged valuation history using a time series LightGBM model.
*   **Live Metrics:** Exposes comprehensive model evaluation metrics from MLflow.
*   **React Dashboard:** Modern glassmorphism UI built with Vite, React, Tailwind CSS, and Recharts.

## Architecture

*   **Backend:** FastAPI, Pandas, scikit-learn, XGBoost, LightGBM
*   **Frontend:** React, Tailwind CSS, ShadCN UI concepts, Recharts
*   **MLOps:** MLflow (experiment tracking), DVC (data versioning)
*   **Deployment:** Docker, GitHub Actions CI/CD

## Running Locally

1. **Install Requirements:**
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Train Models:**
   Models are already trained, but you can retrain them:
   ```bash
   python -m backend.app.ml.train_regression
   python -m backend.app.ml.train_classifier
   python -m backend.app.ml.train_timeseries
   ```

3. **Run Backend & Serve Frontend:**
   First, build the React app:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
   Then run FastAPI:
   ```bash
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
   ```
   Open `http://localhost:8000` in your browser.
