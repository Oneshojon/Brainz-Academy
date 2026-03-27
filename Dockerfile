# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/ui/package*.json ./
RUN npm ci --silent
COPY frontend/ui/ ./
RUN npm run build

# ── Stage 2: Django backend ────────────────────────────────────────────────────
FROM python:3.11-slim

# System deps
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/ui/dist ./frontend/ui/dist

# Collect static files
RUN python manage.py collectstatic --noinput

# Create non-root user
RUN addgroup --system django && adduser --system --ingroup django django
RUN chown -R django:django /app
USER django

EXPOSE 8000

# Gunicorn
CMD ["gunicorn", "examproject.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]

