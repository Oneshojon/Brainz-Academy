# ── Stage 1: Build React frontends (npm workspaces) ───────────────────────────
#
# Both frontend/ui and schools/ui depend on @brainz/shared-ui and
# @brainz/lesson-plan-generator via the npm workspace protocol ("*" in each
# package.json, resolved by symlink rather than the npm registry). That
# resolution only happens when `npm ci` runs from the monorepo ROOT (where
# workspaces is declared in package.json and package-lock.json actually
# knows about the @brainz/* packages) -- running it scoped inside a single
# app's own folder has no visibility into the workspace at all and no way
# to resolve those imports. Each app used to carry its own leftover
# package-lock.json from before the @brainz/* extraction, which silently
# encoded this exact bug (they had never heard of @brainz/*, so `npm ci`
# there would fail outright on a lockfile/package.json mismatch) -- those
# nested lockfiles have been deleted; the root lockfile is the only one
# that matters for a workspaces monorepo like this one.
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY frontend/ui/ ./frontend/ui/
COPY schools/ui/ ./schools/ui/
RUN npm ci --silent
RUN npm run build --workspace=frontend/ui
RUN npm run build --workspace=schools/ui

# ── Stage 2: Django backend ────────────────────────────────────────────────────
FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    pandoc \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-xetex \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Copy both built frontends from stage 1 -- outDir for each is set in its
# own vite.config.js (frontend/ui -> ../static/frontend, schools/ui ->
# ../static/schools), so these paths mirror that exactly rather than
# being guessed here.
COPY --from=frontend-builder /app/frontend/static/frontend ./frontend/static/frontend
COPY --from=frontend-builder /app/schools/static/schools ./schools/static/schools
RUN python manage.py collectstatic --noinput
RUN addgroup --system django && adduser --system --ingroup django django
RUN chown -R django:django /app
USER django
EXPOSE 8000
CMD gunicorn examproject.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120 --access-logfile - --error-logfile -