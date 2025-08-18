FROM rust:1.83 as builder

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-dev build-essential libssl-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages maturin

WORKDIR /app

COPY . .

WORKDIR /app/jagua-rs/pybind

# Build the wheel using maturin
RUN maturin build --release

RUN ls -la /app/jagua-rs/target/wheels/

# Stage 2: Create the final runtime image
FROM python:3.11-slim

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Upgrade pip to latest version
RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built wheel from the builder stage and install it
COPY --from=builder /app/jagua-rs/target/wheels/ /wheels/
RUN pip install --no-cache-dir /wheels/*.whl

COPY . .

# Change ownership of the app directory to the non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

CMD ["python", "python/main.py"]
