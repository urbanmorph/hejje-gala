# Hejje Gala Portal - Architecture Overview

## What is Hejje Gala?

Hejje Gala is Bengaluru's Corporate Active Mobility Challenge - a city-wide initiative encouraging corporates to promote walking and cycling as commute modes or first/last-mile links to public transport. The portal is the web application for the challenge, providing leaderboards and data visualization.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 (Svelte 5 with runes) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn-svelte (New York style) |
| Hosting | Cloudflare Pages (`@sveltejs/adapter-cloudflare`) |
| Storage | Cloudflare R2 (assets) |
| External APIs | Altmo API (registration) |
| i18n | svelte-i18n (English + Kannada) |
| Maps | MapLibre GL JS |
| Fonts | Poppins (via @fontsource) |
| Package Manager | pnpm |
| Build Modes | `production` and `staging` via Vite modes |

## Project Structure

```
portal/
├── src/
│   ├── app.html              # HTML shell
│   ├── app.css               # Global styles (Tailwind, shadcn theme, fonts)
│   ├── app.d.ts              # TypeScript declarations (App.Locals, Platform, env vars)
│   ├── lib/
│   │   ├── assets/            # Bundled JSON data (companies-blr.json)
│   │   ├── components/        # Svelte components
│   │   │   ├── landing/       # Landing page section components (~20 components)
│   │   │   └── ui/            # shadcn-svelte UI primitives (button, input, label, modal)
│   │   ├── config/            # Landing page configuration (landing.ts)
│   │   ├── hooks/             # Svelte 5 composables (useScrollVisibility)
│   │   ├── i18n/              # Internationalization setup + locale files
│   │   │   ├── index.ts       # i18n initialization
│   │   │   └── locales/       # en.json, kn.json
│   │   ├── utils/             # Utility functions
│   │   │   └── index.ts       # General utilities (formatNumber, getTimeRemaining, etc.)
│   │   ├── utils.ts           # shadcn utility (cn function, type helpers)
│   │   └── index.ts           # Lib barrel export (empty)
│   └── routes/                # SvelteKit file-based routing
│       ├── +layout.svelte     # Root layout (imports CSS, i18n, GoToTop)
│       ├── +layout.ts         # Root client layout (initializes i18n)
│       ├── +page.svelte       # Home/landing page
│       ├── about/             # About the challenge
│       ├── activities/        # Activities page
│       ├── calendar/          # Calendar page
│       ├── champions/         # Champions page
│       ├── api/register/       # Registration API endpoint (server-side)
│       ├── leaderboard/       # Leaderboard with city/corporation/company views
│       └── register/          # Registration page
├── r2/                        # R2 bucket data (local copies for reference)
│   ├── company/               # Individual company data JSONs
│   ├── leaderboard/           # Leaderboard data by zone
│   ├── other/                 # Stats, companies list, locations, registration stats
│   └── social/                # Social media content (videos, images)
├── static/                    # Static assets
│   ├── assets/                # Images, logos, icons, SVGs
│   ├── boundaries/            # GBA zone boundary KML files
│   ├── geo/                   # GeoJSON data (bus routes, metro, cycle paths)
│   ├── leaderboard/           # Leaderboard JSON files
├── functions/api/             # Cloudflare Pages Functions (currently empty)
├── wrangler.toml              # Cloudflare Workers/Pages config
├── svelte.config.js           # SvelteKit config (Cloudflare adapter)
├── vite.config.ts             # Vite config (Tailwind + SvelteKit plugins)
├── tailwind.config.js         # Tailwind config (Poppins font)
├── components.json            # shadcn-svelte config
└── package.json               # Dependencies and scripts
```

## Environment Variables

### Public (client-side)
| Variable | Purpose |
|----------|---------|
| `PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key for Places autocomplete |

### Private (server-side only)
| Variable | Purpose |
|----------|---------|
| `ALTMO_DOMAIN` | Altmo API domain |
| `ALTMO_API_KEY` | Altmo API access token |
| `ALTMO_CHALLENGE_ID` | Challenge ID for registration |
| `ALTMO_CITY_ID` | City ID for new company registration |

## Cloudflare Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `GALA_ASSETS` | R2 Bucket | Stores assets |

## External Data Sources

Most dynamic data is fetched from the R2-backed CDN at `https://assets.hejjegala.in/`:

| Endpoint | Data |
|----------|------|
| `/other/stats.json` | Overall challenge statistics |
| `/other/registration-stats.json` | Registration counts |
| `/other/companies-blr.json` | All registered companies in Bengaluru |
| `/other/locations.json` | Map coordinates for corporations and companies |
| `/leaderboard/city.json` | City-level corporation leaderboard |
| `/leaderboard/{zone}.json` | Zone-specific company leaderboards |
| `/leaderboard/All.json` | All-zones company leaderboard |
| `/leaderboard/companies.json` | Company summary data |
| `/leaderboard/{id}-employee.json` | Employee leaderboard for a company |
| `/company/{id}.json` | Individual company detail data |
| `/social/index.json` | Social media content index |

## Build & Deploy

```bash
pnpm dev              # Development server
pnpm build            # Production build
pnpm build-staging    # Staging build
pnpm preview          # Preview production build
pnpm check            # Type checking
pnpm lint             # Linting + formatting check
```
