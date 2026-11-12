## The nest2d strip file processing worker

This worker processes DXF files uploaded for the **strip nesting** feature. It is a
separate worker from the regular `fileprocessing` worker and operates on its own
Postgres table / file bucket so the two never conflict.

What it does:

- Polls the `strip_user_dxf_files` table for rows with
  `processing_status = 'pending'` (there is **no `worker_tag` concept** here — every
  pending strip file is eligible).
- Reads the user input DXF from the `files` table (bucket `strip_user_dxf`).
- Rebuilds the DXF and computes the closed polygons, using the DXF `handle` value
  as the unique identifier for the parts.
- Stores the result in the `polygon_parts` jsonb column — a list of
  objects, each with `coordinates`, `handles`, `width` and `height`.
- Marks the row `completed` (or `error` on failure).

## Configuration

The worker reads `DATABASE_URL` from the environment (a local `.env` file is supported
via `python-dotenv`):

```
DATABASE_URL=postgres://nest2d:nest2d@localhost:5432/nest2d
```

The schema is created and migrated by the main app on startup, so start the app
once against the database before running the worker.

## Local development run

### Option A — Python virtualenv

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

The worker runs in a loop, picking up pending strip files. Stop it with `Ctrl+C`
(SIGTERM resets any in-flight job back to `pending`).

### Option B — Docker

Build the image:

```sh
docker build -t nest2d-worker-stripfileprocessing:local .
```

> If the build fails with `Temporary failure in name resolution` during
> `pip install`, the build network has no working DNS. Build using the host
> network instead:
>
> ```sh
> docker build --network=host -t nest2d-worker-stripfileprocessing:local .
> ```
>
> Alternatively, configure the Docker daemon's DNS once in
> `/etc/docker/daemon.json` (`{ "dns": ["8.8.8.8", "8.8.4.4"] }`) and restart
> Docker.

Run it for local development (mounts the source and uses host networking so it can
reach a local Postgres):

```sh
docker run --network host --env-file ./.env -it -v "$(pwd):/app" -w /app nest2d-worker-stripfileprocessing:local python main.py
```

Or drop into a shell instead:

```sh
docker run --network host --env-file ./.env -it -v "$(pwd):/app" -w /app nest2d-worker-stripfileprocessing:local bash
```

## Debugging — visualize polygon_parts

`show_polygon_parts.py` connects to the same database (via the shared `.env`) and
helps inspect what the worker produced.

List all strip files for an owner (slug + project name + status):

```sh
python show_polygon_parts.py --owner "google:1234567890"
```

Plot the `polygon_parts` of a single file by its slug (each part is drawn as a
closed polygon, labelled with its handle count):

```sh
python show_polygon_parts.py --slug "my-part-aB12cd.dxf"
```

Plotting needs matplotlib (not part of the worker runtime image):

```sh
pip install matplotlib
```

## Production

The worker is built and published by CI as
`ghcr.io/vovastelmashchuk/strip-file-processing-worker` and deployed via
`docker-stack.yml` (service `strip-file-processing-worker`).
