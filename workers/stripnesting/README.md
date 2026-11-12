# Strip nesting worker (sparrow / spyrrow)

This worker solves the **strip nesting** jobs for the strip application. The user
provides the material **height** and the solver computes the layout that
minimises the **width** of the strip — the opposite of the bin nesting worker,
which fits parts into fixed-size sheets.

It is completely independent from the bin `nesting` worker: it has its own job
queue, its own result file bucket, and does not touch any bin table.

## How it works

- Polls the `strip_nesting_jobs` table for jobs with
  `status = 'pending'`, atomically flipping one to `processing`.
- A job row looks like (created by `POST /api/strip/{slug}/nest`):

  ```json
  {
    "slug": "strip-nested-...",
    "strip_slug": "my-strip-project-...",
    "files": [{ "slug": "part-aB12cd.dxf", "simpleName": "part", "count": 4, "angle": [0] }],
    "params": { "height": 100 },
    "status": "pending",
    "owner_id": "google:1234567890"
  }
  ```

- For every file it loads the `polygon_parts` (closed outlines + handles)
  attached to the `strip_user_dxf_files` row by the **stripfileprocessing**
  worker. Every part becomes one nesting item with `demand = count`.
- Parts are **not rotated** (the strip feature has no rotation option), so each
  item is given a single allowed orientation of `0°`.
- It calls [sparrow](https://github.com/JeroenGar/sparrow) through the
  [spyrrow](https://github.com/PaulDL-RS/spyrrow) Python wrapper:

  ```python
  instance = spyrrow.StripPackingInstance(slug, strip_height=height, items=items)
  solution = instance.solve(spyrrow.StripPackingConfig(total_computation_time=30, seed=0))
  # solution.width, solution.placed_items[i].{id, rotation, translation}
  ```

- Strip packing always places every item (the strip grows to fit), so there is
  no "could not place" failure path.
- The placed outlines are written into a single result DXF built straight from
  the part coordinates, then stored in the `files` table (bucket `strip_nest_dxf`). The
  strip application works with DXF and database information only — no SVG is
  generated. The job row is updated with `width`, `density`, `placed`,
  `requested`, `dxf_files` and finally `status: "done"` (or `error`).

## Configuration

Reads `DATABASE_URL` from the environment (a local `.env` is supported via
`python-dotenv`). Copy the example and fill it in:

```sh
cp .env.example .env
```

```
DATABASE_URL=postgres://nest2d:nest2d@localhost:5432/nest2d
# STRIP_NEST_TIME=30   # optional solver time budget (seconds)
```

## Local development run

### Option A — Python virtualenv

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

`spyrrow` is distributed as a prebuilt wheel (it bundles the compiled sparrow
Rust solver), so no Rust toolchain is required. Stop the worker with `Ctrl+C`
(SIGTERM resets any in-flight job back to `pending`).

### Option B — Docker

```sh
docker build -t nest2d-worker-stripnesting:local .
```

> If the build fails with `Temporary failure in name resolution` during
> `pip install`, the build network has no working DNS. Build using the host
> network instead:
>
> ```sh
> docker build --network=host -t nest2d-worker-stripnesting:local .
> ```

Run it for local development (host networking so it can reach a local Postgres):

```sh
docker run --network host --env-file ./.env -it -v "$(pwd):/app" -w /app nest2d-worker-stripnesting:local python main.py
```

Or drop into a shell:

```sh
docker run --network host --env-file ./.env -it -v "$(pwd):/app" -w /app nest2d-worker-stripnesting:local bash
```

## Reprocessing a job

To re-run a finished job, reset it in Postgres:

```sql
UPDATE strip_nesting_jobs
SET status = 'pending', dxf_files = '{}', width = NULL
WHERE slug = 'strip-nested-...';
```

## Production

The worker is built and published by CI as
`ghcr.io/vovastelmashchuk/strip-nesting-worker` and deployed via
`docker-stack.yml` (service `strip-nesting-worker`).
