# Database ↔ Function Region

The single biggest knob on per-request latency is the round trip between
the Vercel function instance and the Supabase Postgres host. Every
Prisma call pays one RTT before Postgres looks at it; a profile-modal
open does ~15 queries; the maths add up fast.

## Current setup

| Component | Host | Region |
| --- | --- | --- |
| Vercel functions | `fra1` (Frankfurt) — pinned in `vercel.json` | EU |
| Supabase Postgres | `aws-0-eu-west-1.pooler.supabase.com` (Dublin) | EU |
| RTT (typical) | ~25–30 ms | |

Before the `fra1` pin, functions ran in `iad1` (Washington DC) by
default — every query paid ~80–90 ms of transatlantic RTT, so a
15-query endpoint spent over a second on the wire alone.

## How to change it

There are three valid configurations. Pick one based on where most
users sit and what tier your Vercel project is on.

### Option A — keep both in EU (current)

```jsonc
// vercel.json
{
  "framework": "nextjs",
  "regions": ["fra1"]   // any single Vercel EU region works
}
```

Supabase project stays in `eu-west-1`. RTT 25–30 ms. Works on every
Vercel tier including Hobby. **This is what's set today.**

### Option B — move both to US

Use this if most operators are in North America or if you want
faster cold starts (US edge is more aggressive than EU on Vercel).

1. **Supabase**: create a new project in `us-east-1`, restore from a
   backup of the current project, then swap `DATABASE_URL` and
   `DIRECT_URL` env vars in Vercel and any local `.env`. Reseed if
   the dump fails.
2. **Vercel**: change the pin in `vercel.json`:
   ```jsonc
   {
     "framework": "nextjs",
     "regions": ["iad1"]
   }
   ```
3. Redeploy. Verify `/api/health` round-trip is back under ~150 ms.

Supabase region migration is irreversible — once you've moved to
`us-east-1` you can't move back without another full restore. Confirm
the bulk of your operators are in NA before doing this.

### Option C — multi-region functions (Pro+ only)

Only relevant if you have users on both continents simultaneously
and you can afford the Pro tier. Vercel will run the function in the
region nearest the request, but **all** of them still hit the single
Supabase host — so you get edge-fast routing into the function and
then a long DB hop from the far one.

In practice this is rarely worth the bill for an EMS. Pick A or B.

## What this doesn't fix

Region pinning shaves milliseconds off **the wire**. It does not
help if:

- An endpoint runs 15 sequential queries instead of `Promise.all`.
  Check `/api/employees/[id]/profile` — that's the slowest hotspot
  and already batches.
- pgBouncer's pool is saturated. The transaction pool is sized in
  the Supabase dashboard; default 15 is fine for the seed dataset.
- The client polls aggressively. SWR has a `dedupingInterval: 5000`
  + `refreshWhenHidden: false` set globally; the polling contexts
  pause on `visibilityState !== 'visible'`. Both shipped already.

## Verifying after a region change

```bash
# From inside Vercel's function (curl in a `/api/health` handler):
time curl https://your-app.vercel.app/api/health

# Expected single-query round-trip:
# Co-located:        80–150 ms
# Cross-continent:  300–500 ms
```

If you're co-located but seeing >300ms, check that the build is
hitting the **pooler** URL (`aws-0-<region>.pooler.supabase.com`) and
not the direct compute host — the pooler is in the same AZ as the DB,
the direct host can be elsewhere depending on tier.
