# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/ui/package*.json ./frontend/ui/
COPY frontend/ui/ ./frontend/ui/
WORKDIR /app/frontend/ui
RUN npm ci --silent && npm run build

# ── Stage 2: Django backend ────────────────────────────────────────────────────
FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/static/frontend ./frontend/static/frontend
RUN python manage.py collectstatic --noinput
RUN addgroup --system django && adduser --system --ingroup django django
RUN chown -R django:django /app
USER django
EXPOSE 8000
CMD gunicorn examproject.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120 --access-logfile - --error-logfile -
# cache bust
