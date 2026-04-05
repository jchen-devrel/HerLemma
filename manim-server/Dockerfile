FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir manim flask flask-cors

WORKDIR /app
COPY server.py /app/
EXPOSE 5050
CMD ["python", "server.py"]
