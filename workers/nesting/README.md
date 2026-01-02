# Nesting Worker with jagua-rs Integration

This worker integrates the [jagua-rs](https://github.com/JeroenGar/jagua-rs) Rust library for 2D irregular cutting and packing problems.

## Architecture

```
workers/nesting/
├── jagua-rs/           # Git submodule of jagua-rs Rust library
├── jagua_wrapper.py    # Python wrapper for jagua-rs
├── core/main.py        # Main nesting logic using jagua-rs
└── requirements.txt    # Python dependencies
```

## How to build docker image

To build and run the nesting worker in a Docker container, follow these steps:

1. **Build the Docker image:**
```sh
docker build -t nesting-worker:local .
```

This will:
- Build the `jagua-rs` Rust library inside the container.
- Install Python dependencies from `requirements.txt`.
- Set up the worker environment.

3. **Run the Docker container:**
```sh
docker run --rm -it nesting-worker
```

You can mount a local directory for input/output if needed:
```sh
docker run --rm -it -v $(pwd)/data:/app/data nesting-worker
```

With network 
```sh
docker run --network host -it -v "$(pwd):/app" -w /app nesting-worker:local bash
```

Run as service

```sh
docker service create \
  --name my-nesting-service \
  --env-file ./.env \
  nest2d-worker-nesting:local
```