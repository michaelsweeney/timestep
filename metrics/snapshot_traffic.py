#!/usr/bin/env python3
"""Snapshot GitHub release downloads + repo traffic into metrics/traffic.tsv.

Append-only, deduped history that survives GitHub's 14-day traffic window.
Pulls ONLY aggregate counts (no referrers/paths), so the output is safe to
version in the repo.

Three row kinds (long format: date, kind, key, count, uniques):
  download_cum  <tag>/<asset>  cumulative download_count, snapshotted today
  views_daily   <day>          per-day repo page views   (from the API series)
  clones_daily  <day>          per-day repo git clones    (from the API series)

Dedup rules on re-run:
  - daily rows are keyed by their day and overwritten with the freshest pull
    (the 14-day window overlaps between runs; latest value wins)
  - download_cum rows are keyed by (today, tag/asset); same-day re-runs
    overwrite, later days append a new cumulative point

NOTE: raw clone counts are inflated by CI — every GitHub Actions run (test +
release matrix) clones the repo. Treat `views_daily` as the human signal.

Auth: uses your local `gh` CLI auth. Requires push access for the traffic API.
"""
import csv
import json
import os
import subprocess
import sys
from datetime import date

REPO = "michaelsweeney/timestep"
HERE = os.path.dirname(os.path.abspath(__file__))
TSV = os.path.join(HERE, "traffic.tsv")
COLUMNS = ["date", "kind", "key", "count", "uniques"]

# Release assets worth tracking — skip autoupdate manifests and blockmaps.
INSTALLER_SUFFIXES = (".exe", ".msi", ".dmg", ".zip", ".AppImage", ".deb", ".rpm")


def gh_json(path):
    out = subprocess.run(
        ["gh", "api", f"repos/{REPO}/{path}"],
        capture_output=True, text=True,
    )
    if out.returncode != 0:
        sys.stderr.write(f"gh api {path} failed:\n{out.stderr}\n")
        sys.exit(1)
    return json.loads(out.stdout)


def load_existing():
    """Return {(date, kind, key): (count, uniques)} from the current TSV."""
    rows = {}
    if not os.path.exists(TSV):
        return rows
    with open(TSV, newline="") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            rows[(r["date"], r["kind"], r["key"])] = (r["count"], r["uniques"])
    return rows


def main():
    rows = load_existing()
    today = date.today().isoformat()

    # --- cumulative download counts (point-in-time, dated today) ---
    for rel in gh_json("releases"):
        tag = rel["tag_name"]
        for a in rel.get("assets", []):
            if a["name"].endswith(INSTALLER_SUFFIXES):
                key = f"{tag}/{a['name']}"
                rows[(today, "download_cum", key)] = (str(a["download_count"]), "")

    # --- daily repo traffic series (overwrite by day; latest pull wins) ---
    views = gh_json("traffic/views")
    for v in views.get("views", []):
        day = v["timestamp"][:10]
        rows[(day, "views_daily", day)] = (str(v["count"]), str(v["uniques"]))

    clones = gh_json("traffic/clones")
    for c in clones.get("clones", []):
        day = c["timestamp"][:10]
        rows[(day, "clones_daily", day)] = (str(c["count"]), str(c["uniques"]))

    # --- write back, sorted by (date, kind, key) for stable diffs ---
    with open(TSV, "w", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(COLUMNS)
        for (d, kind, key) in sorted(rows):
            count, uniques = rows[(d, kind, key)]
            w.writerow([d, kind, key, count, uniques])

    print(f"snapshot {today}: {len(rows)} total rows -> {TSV}")


if __name__ == "__main__":
    main()
