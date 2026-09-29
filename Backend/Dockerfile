FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for postgres and libpq
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create upload directory
RUN mkdir -p /app/storage_uploads

EXPOSE 8000

CMD ["sh", "-c", "python -m app.core.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
