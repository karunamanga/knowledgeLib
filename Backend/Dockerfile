FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    WEB_CONCURRENCY=1 \
    MALLOC_ARENA_MAX=2 \
    PORT=8000

# Install requirements (psycopg2-binary provides pre-compiled Linux wheels)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create upload directory for temporary / local asset storage
RUN mkdir -p /app/storage_uploads

EXPOSE 8000

# Start lightweight Uvicorn server with dynamic port and single worker for memory efficiency
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --limit-concurrency 50"]
