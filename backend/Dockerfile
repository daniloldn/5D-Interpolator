# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY pyproject.toml .
RUN pip install -e .

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p data/uploads data/processed

# Make data directories writable
RUN chmod 777 -R data/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
