FROM python:3.11-slim

# System dependencies for OpenCV, FFmpeg, and networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy surveillance codebase
COPY . /app/ai_surveillance

ENV PYTHONPATH=/app
ENV SURVEILLANCE_ENV=production
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "ai_surveillance.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

