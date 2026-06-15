# Load test scripts

[k6](https://k6.io) scenarios for Suler EMS. Run against a local dev server
or a deployed environment — the same scripts work, only the `BASE_URL` env
var changes.

## Prerequisites

```powershell
# Windows
winget install k6

# macOS
brew install k6

# Linux
sudo apt install k6
```

## Authentication

The credentials provider expects an HTTPS-friendly cookie flow. For load
tests we hit `/api/auth/csrf` and `/api/auth/callback/credentials` directly,
then reuse the resulting `next-auth.session-token` cookie. That dance is
encapsulated in `_auth.js`.

You'll need a test user (the default seed's `admin@suler.com / Admin123!`
works for any scenario). Override via env:

```powershell
$env:LOAD_EMAIL = "admin@suler.com"
$env:LOAD_PASSWORD = "Admin123!"
$env:BASE_URL = "http://localhost:3000"
```

## Scenarios

| File | What it exercises | Default VUs / duration |
|---|---|---|
| `smoke.js` | Sanity check — login + 5 GET endpoints | 1 VU × 1 min |
| `read-heavy.js` | Reads dashboards, audit feed, finance + payroll lists | 20 VUs × 5 min |
| `payroll-write.js` | Creates draft runs (one per VU iteration) — measures the cost of the snapshot loop | 5 VUs × 3 min |

## Run

```powershell
k6 run scripts/loadtest/smoke.js
k6 run --vus 20 --duration 5m scripts/loadtest/read-heavy.js
k6 run --vus 5  --duration 3m scripts/loadtest/payroll-write.js
```

## What to watch

- `http_req_duration` p95 < 500ms for GET endpoints (read-heavy)
- `http_req_failed` rate < 1%
- `payroll_create_draft_ms` p95 < 5_000ms (sync threshold — above this,
  Inngest async dispatch is the right answer)

## Async payroll threshold

`PATCH /api/payroll/runs/[id]/transition` with `action=PROCESS`:

- entries < 100 → sync (full response with the processed run)
- entries ≥ 100 → 202 Accepted, Inngest worker processes; poll
  `GET /api/payroll/runs/[id]` for status

`payroll-write.js` triggers the sync path. To exercise the async path you
need a seed with 100+ active employees in a single department.
