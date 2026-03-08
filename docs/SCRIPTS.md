# Python Scripts & Automation

## api.py - Leaderboard Generator & R2 Uploader

Main data pipeline script that fetches challenge data from the Altmo API, generates leaderboard JSONs, and uploads them to Cloudflare R2.

### Environment Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `ALTMO_DOMAIN` | `altmo.app` | Altmo API domain |
| `ALTMO_API_KEY` | (hardcoded) | API access token |
| `ALTMO_CHALLENGE_ID` | `41` | Challenge ID |
| `ALTMO_CITY_ID` | `18326` | City ID |
| `R2_ACCOUNT_ID` | - | Cloudflare R2 account |
| `R2_ACCESS_KEY_ID` | - | R2 access key |
| `R2_SECRET_ACCESS_KEY` | - | R2 secret key |

### Classes

**APIClient** - Fetches data from the Altmo API:
- `fetch_challenge_data()` - Challenge with activities and leaderboard
- `fetch_registration_stats()` - Registered org count and campus names
- `fetch_overall_stats()` - Overall statistics
- `fetch_companies_blr()` - All companies for Bengaluru
- `fetch_company_details(company_id)` - Individual company data

**ActivityProcessor** - Classifies activities:
- Activity types: recreation, commute, transit
- Activity modes: walk, cycle, all
- Dimensions: recreationAll, commuteWalk, transitCycle, etc.
- Extracts metrics: distance_km, co2Offset, fuelSaved, moneySaved

**CompanyMapper** - Maps companies to GBA zones:
- Zones: central, east, north, south, west, elcita

**ActivityAggregator** - Aggregates activities:
- Company-level and user-level aggregation
- Pre-populates with zero-activity companies from leaderboard

**JSONGenerator** - Creates leaderboard JSONs:
- Corporation JSON for each zone
- City-wide aggregated JSON
- Companies summary JSON
- Overall ("All") combined ranking

**R2Uploader** - Uploads to Cloudflare R2:
- Leaderboards: city.json, All.json, companies.json, zone JSONs
- Stats: stats.json, registration-stats.json
- Companies: companies-blr.json

### Scoring Formula
- Score = activities * 0.5 + co2Offset * 0.3 + fuelSaved * 0.1 + moneySaved * 0.1
- Ties broken by employee count

### CLI Arguments
```bash
python api.py --generate-leaderboards --upload     # Generate and upload leaderboards
python api.py --generate-stats --upload             # Generate and upload stats
python api.py --generate-registration-stats --upload
python api.py --generate-companies --upload
python api.py --generate-company-details --upload
```

### Output Directories
- `r2/leaderboard/` - Leaderboard JSONs
- `r2/other/` - Stats and company data
- `r2/company/` - Individual company details
- `temp/` - Cached API responses

---

## social.py - Social Media Asset Manager

Manages social media assets (images/videos) in Cloudflare R2 and maintains an index.json.

### Features
- Uploads images (.jpg, .jpeg, .png, .gif, .webp, .svg) and videos (.mp4, .webm, .mov, .avi, .mkv)
- Generates 8-character alphanumeric keys for filenames
- Maintains `social/index.json` in R2 with asset metadata
- Supports batch uploads from directories

### CLI Arguments
```bash
python social.py --file photo.jpg --type image --social-url "https://instagram.com/..." --author "username"
python social.py --directory ./media --type image
python social.py --list                    # List all assets
python social.py --remove "key.jpg"        # Remove asset
python social.py --update-keys             # Regenerate all asset keys
```

### Index Entry Schema
```json
{
  "url": "filename.jpg",
  "type": "image|video",
  "socialUrl": "https://instagram.com/...",
  "author": "username",
  "alt": "optional description",
  "thumbnail": "optional-thumbnail.jpg"
}
```

---

## cron.sh - Scheduled Data Pipeline

Continuously runs api.py at configurable intervals with logging.

### Usage
```bash
./cron.sh                                    # Default: 5-min interval
./cron.sh --sleep 600                        # 10-min interval
./cron.sh --options "--generate-stats --upload"  # Custom options
```

### Default Behavior
- Interval: 300 seconds (5 minutes)
- Options: `--generate-stats --generate-registration-stats --generate-leaderboards --upload`
- Logs to: `api.py.log.YYYYMMDD_HHMMSS`
- Handles SIGINT/SIGTERM for graceful shutdown

---

## echo.sh - Debug HTTP Echo Server

Simple HTTP echo server on port 8080 using netcat. Returns the incoming request as the response body. For testing/debugging only.

---

## requirements.txt

Python dependencies for the scripts:
```
boto3        # AWS S3-compatible client for Cloudflare R2
requests     # HTTP client for Altmo API
```
