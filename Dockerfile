# Stage 1: Build React frontend
FROM node:20-alpine AS build-stage
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve with FastAPI
FROM python:3.10-slim AS serve-stage
WORKDIR /app

# System dependencies for scikit-learn/XGBoost
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, models, metrics, data
COPY backend/ ./backend/
COPY models/ ./models/
COPY metrics/ ./metrics/
COPY data/ ./data/

# Copy built frontend output
COPY --from=build-stage /app/frontend/dist /app/frontend/dist

# Mount static frontend via FastAPI
# Wait, main.py doesn't currently mount static files. Let's patch it quickly via bash later or assume proxy via nginx.
# Actually, we should edit main.py to mount the react app. 

EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
