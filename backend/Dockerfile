FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for audio processing and build
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application into a 'backend' package
COPY . /app/backend

# Create data directory
RUN mkdir -p /data
ENV VOICEBOX_DATA_DIR=/data

# Expose port
EXPOSE 8000

# Run the server as a module
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
