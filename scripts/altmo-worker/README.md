# Hejje Gala refresh worker

Cloudflare Worker that fetches Altmo challenge data and uploads leaderboard
JSONs to the `hejje-gala-assets` R2 bucket. Runs hourly via cron trigger.

## One-time setup

```bash
cd scripts/altmo-worker
npm install

# Log in to Cloudflare
npx wrangler login

# Store the Altmo API key as a secret (wrangler will prompt for the value)
npx wrangler secret put ALTMO_API_KEY
```

## Deploy

```bash
npx wrangler deploy
```

## Test

```bash
# Trigger manually via HTTP
curl https://hejje-gala-cron.<account>.workers.dev/refresh

# Watch live logs
npx wrangler tail
```

## Configuration

- `wrangler.toml` — cron schedule, R2 binding, non-secret vars
- `src/index.ts` — all the logic, ported from `scripts/altmo/api.py`

Outputs written to R2 (served at `https://assets.hejjegala.in/`):

- `leaderboard/city.json`
- `leaderboard/All.json`
- `leaderboard/companies.json`
- `leaderboard/{corpId}.json` (central, east, north, south, west, elcita, blr-urban, blr-rural)
- `other/stats.json`
