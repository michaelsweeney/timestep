# metrics

Lightweight, GitHub-native usage tracking — no third-party service for the parts
GitHub already measures.

## What's here

- **`snapshot_traffic.py`** — pulls release download counts + repo traffic via the
  `gh` CLI and appends a deduped history to `traffic.tsv`.
- **`traffic.tsv`** — append-only long-format history (`date, kind, key, count,
  uniques`). Safe to version: aggregate counts only, no referrers or paths.

## Row kinds

| kind | key | meaning |
|------|-----|---------|
| `download_cum` | `<tag>/<asset>` | cumulative download count, snapshotted on `date` |
| `views_daily`  | the day | repo page views that day (from GitHub's 14-day series) |
| `clones_daily` | the day | git clones that day |

## ⚠️ Clones are CI-inflated

Every GitHub Actions run (test + release matrix) clones the repo, so
`clones_daily` spikes around CI activity and is **not** a human-usage signal.
Use `views_daily` for that. (Example: clones jumped to 112/276/235 on
2026-06-11..13 — the v2.0.0 release builds — while page views were 0.)

## Running

```bash
python3 metrics/snapshot_traffic.py
```

Re-running is safe and idempotent within a day. Because GitHub's traffic API only
retains 14 days, run it at least every ~10 days to avoid gaps. The `download_cum`
rows are cumulative point-in-time samples; daily traffic rows overwrite by day
(freshest pull wins).

### Scheduling

A weekly local cron / systemd user timer is enough. The script writes the TSV;
committing is left manual (or add `git add metrics/traffic.tsv && git commit` to
the scheduled wrapper — keep it a local commit, push on your own cadence).

## Pages page-views

`traffic.tsv` covers downloads + repo traffic. Visits to the **published docs
site** (the GitHub Pages landing page) are measured separately by the Cloudflare
Web Analytics beacon in `docs/index.html` (cookieless, no consent banner). It
replaced the legacy Google Analytics / Tag Manager tags. View it in the
Cloudflare dashboard → Web Analytics, filtered to `/timestep/` paths (the beacon
is registered on the shared `michaelsweeney.github.io` hostname).
