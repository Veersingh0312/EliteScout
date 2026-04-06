# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --frozen-lockfile || npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Prepare Python Dependencies (WHEELS)
FROM python:3.11-slim AS backend-builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
# --prefer-binary is KEY to avoiding OOM during compilation of wheels on low-RAM hosts
RUN pip install --upgrade pip && \
    pip wheel --no-cache-dir --wheel-dir /app/wheels --prefer-binary -r requirements.txt

# Stage 3: Final Production Image
FROM python:3.11-slim AS final
WORKDIR /app

# Only core runtime library needed for XGBoost/LightGBM
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder and install
COPY --from=backend-builder /app/wheels /app/wheels
RUN pip install --no-cache-dir /app/wheels/* && rm -rf /app/wheels

# Copy backend application code
COPY backend/ ./backend/
COPY models/ ./models/
COPY metrics/ ./metrics/
COPY data/ ./data/

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# EXPOSE and Start
EXPOSE 8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
