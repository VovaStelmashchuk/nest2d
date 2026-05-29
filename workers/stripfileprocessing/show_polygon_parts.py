#!/usr/bin/env python3
"""
Debug helper for the strip file processing worker.

Connects to the same MongoDB database as the worker (via the shared `utils.mongo`
module, which loads the `.env` file) and lets you:

  * Plot the `polygonParts` of a single strip file by its slug.
  * List every strip file slug (with its project name) for a given owner id.

Usage:
    # List all files for an owner (slug + project name + status)
    python show_polygon_parts.py --owner "google:1234567890"

    # Plot the polygonParts of a single file
    python show_polygon_parts.py --slug "my-part-aB12cd.dxf"

Plotting requires matplotlib:
    pip install matplotlib
"""

import argparse
import sys

from utils.mongo import db

strip_user_dxf_files = db["strip_user_dxf_files"]
strip_projects = db["strip_projects"]


def list_files_for_owner(owner_id: str) -> None:
    files = list(
        strip_user_dxf_files.find(
            {"ownerId": owner_id},
            {"slug": 1, "name": 1, "stripSlug": 1, "processingStatus": 1},
        ).sort("uploadAt", 1)
    )

    if not files:
        print(f"No strip files found for owner '{owner_id}'.")
        return

    # Resolve project names in one query.
    strip_slugs = {f.get("stripSlug") for f in files if f.get("stripSlug")}
    projects = strip_projects.find(
        {"slug": {"$in": list(strip_slugs)}}, {"slug": 1, "name": 1}
    )
    project_name_by_slug = {p["slug"]: p.get("name", "") for p in projects}

    print(f"Strip files for owner '{owner_id}' ({len(files)}):\n")
    header = f"{'PROJECT':<24} {'STATUS':<12} {'FILE SLUG'}"
    print(header)
    print("-" * len(header))
    for f in files:
        project_name = project_name_by_slug.get(f.get("stripSlug"), "<unknown>")
        status = f.get("processingStatus", "?")
        print(f"{project_name:<24} {status:<12} {f.get('slug')}")


def plot_file(slug: str) -> None:
    doc = strip_user_dxf_files.find_one({"slug": slug})
    if doc is None:
        print(f"No strip file found with slug '{slug}'.")
        sys.exit(1)

    parts = doc.get("polygonParts")
    if not parts:
        status = doc.get("processingStatus", "?")
        print(
            f"File '{slug}' has no polygonParts yet "
            f"(processingStatus: {status}). Has the worker processed it?"
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
        description="Show strip file polygonParts or list an owner's strip files."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--slug", help="file slug to plot its polygonParts")
    group.add_argument("--owner", help="owner id to list their strip files")

    args = parser.parse_args(argv)

    if args.owner:
        list_files_for_owner(args.owner)
    else:
        plot_file(args.slug)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
