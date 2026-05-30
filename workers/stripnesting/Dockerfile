FROM python:3.11-slim

WORKDIR /app

# spyrrow ships manylinux x86_64 wheels (it wraps the sparrow Rust solver), so
# there is no Rust toolchain / cargo build step here — a plain pip install is
# enough, unlike the jagua-rs based bin nesting worker.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
