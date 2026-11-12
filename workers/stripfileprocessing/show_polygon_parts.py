#!/usr/bin/env python3
"""
Debug helper for the strip file processing worker.

Connects to the same Postgres database as the worker (via the shared `utils.db`
module, which loads the `.env` file) and lets you:

  * Plot the `polygon_parts` of a single strip file by its slug.
  * List every strip file slug (with its project name) for a given owner id.

Usage:
    # List all files for an owner (slug + project name + status)
    python show_polygon_parts.py --owner "google:1234567890"

    # Plot the polygon_parts of a single file
    python show_polygon_parts.py --slug "my-part-aB12cd.dxf"

Plotting requires matplotlib:
    pip install matplotlib
"""

import argparse
import sys

from utils import db


def list_files_for_owner(owner_id: str) -> None:
    files = db.fetchall(
        """
        SELECT f.slug, f.processing_status, p.name AS project_name
        FROM strip_user_dxf_files f
        LEFT JOIN strip_projects p ON p.slug = f.strip_slug
        WHERE f.owner_id = %s
        ORDER BY f.upload_at
        """,
        (owner_id,),
    )

    if not files:
        print(f"No strip files found for owner '{owner_id}'.")
        return

    print(f"Strip files for owner '{owner_id}' ({len(files)}):\n")
    header = f"{'PROJECT':<24} {'STATUS':<12} {'FILE SLUG'}"
    print(header)
    print("-" * len(header))
    for f in files:
        project_name = f.get("project_name") or "<unknown>"
        status = f.get("processing_status") or "?"
        print(f"{project_name:<24} {status:<12} {f.get('slug')}")


def plot_file(slug: str) -> None:
    doc = db.fetchone(
        "SELECT name, processing_status, polygon_parts FROM strip_user_dxf_files WHERE slug = %s",
        (slug,),
    )
    if doc is None:
        print(f"No strip file found with slug '{slug}'.")
        sys.exit(1)

    parts = doc.get("polygon_parts")
    if not parts:
        status = doc.get("processing_status", "?")
        print(
            f"File '{slug}' has no polygon_parts yet "
            f"(processing_status: {status}). Has the worker processed it?"
        )
        sys.exit(1)

    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib is required for plotting. Install it with:\n"
              "    pip install matplotlib")
        sys.exit(1)

    fig, ax = plt.subplots()

    for index, part in enumerate(parts):
        coords = part.get("coordinates") or []
        if len(coords) < 2:
            continue

        xs = [point[0] for point in coords]
        ys = [point[1] for point in coords]

        # Close the ring for a clean outline.
        xs_closed = xs + [xs[0]]
        ys_closed = ys + [ys[0]]

        handles = part.get("handles", [])
        label = f"part {index} ({len(handles)} handles)"

        ax.fill(xs, ys, alpha=0.3)
        ax.plot(xs_closed, ys_closed, linewidth=1, label=label)

    ax.set_aspect("equal", adjustable="datalim")
    ax.set_title(f"{doc.get('name', slug)}\n{len(parts)} part(s) — {slug}")
    ax.legend(loc="best", fontsize="small")
    plt.tight_layout()
    plt.show()


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Show strip file polygon_parts or list an owner's strip files."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--slug", help="file slug to plot its polygon_parts")
    group.add_argument("--owner", help="owner id to list their strip files")

    args = parser.parse_args(argv)

    if args.owner:
        list_files_for_owner(args.owner)
    else:
        plot_file(args.slug)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
