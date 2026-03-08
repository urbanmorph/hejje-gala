# Static Assets & Data

## Asset CDN

Production assets are served from `https://assets.hejjegala.in/` (Cloudflare R2 bucket: `hejje-gala-assets`).

The `r2/` directory in the repo contains local copies of this data for reference/development.

## Static Directory (`static/`)

### Images & Logos (`static/assets/`)
| File | Purpose |
|------|---------|
| `logo.png` | Main site logo |
| `logo-footer.png` | Footer/form logo |
| `logo-footer-cta.png` | Footer CTA section logo |
| `banner.png` | Hero banner background |
| `landing-banner.png` | Landing page banner |
| `about-banner.png` | About page banner |
| `phone.png` | Phone mockup for hero |
| `circle.png` | Decorative circle element |
| `why-before.png` / `why-after.png` | Before/after comparison images |
| `testimonial.png` | Testimonial section image |
| `app-store.png` / `play-store.png` | App store download buttons |
| `altmo.png` / `wri.png` / `gba.png` / `walkaluru.png` | Partner logos |
| `star.svg` | Star rating icon |
| `icon-co2.png` / `icon-fuel.png` / `icon-users.png` / `icon-activities.png` | Stats section icons |

### Transport Icons (`static/assets/icons/`)
| File | Purpose |
|------|---------|
| `activities.svg` | Activities icon |
| `co2.svg` | CO2 icon |
| `fuel.svg` | Fuel icon |

### Transport SVGs (`static/assets/`)
| File | Purpose |
|------|---------|
| `bus.svg` / `bus-black.svg` | Bus route icons |
| `metro.svg` | Metro icon |
| `metro-green.svg` / `metro-purple.svg` / `metro-yellow.svg` | Metro line colors |

### GeoJSON Data (`static/geo/`)
| File | Contents |
|------|----------|
| `bus.json` | Bus route geometries (~1.5MB) |
| `metro.json` | Metro line geometries (~223KB) |
| `cycle.geojson` | Cycling path geometries (~63KB) |

### GBA Zone Boundaries (`static/boundaries/`)
KML files defining Greater Bengaluru Authority zone boundaries:
- `gba_central.kml`, `gba_east.kml`, `gba_north.kml`, `gba_south.kml`, `gba_west.kml`
- `gba_zones_2025.kml` - Combined zones
- `GBA_corporation boundaries_Nov 2025.kml` - Corporation boundaries

### Other Static Files
| File | Purpose |
|------|---------|
| `GBA_CC_Letter_Companies.pdf` | GBA letter for companies (downloadable) |
| `robots.txt` | Allows all crawlers |
| `site.webmanifest` | PWA manifest (icons only, no name set) |
| `favicon.ico` + PNG variants | Favicons |

## R2 Bucket Data (`r2/`)

### Company Data (`r2/company/`)
- `{id}.json` - Individual company data with statistics (~400+ files)
- Contains: id, name, address, empCount, lat/lng, statistics, campusNames/Ids

### Leaderboard (`r2/leaderboard/`)
- `All.json` - Overall company leaderboard across all zones
- `city.json` - Corporation-level leaderboard
- `central.json`, `south.json`, `east.json`, `north.json`, `west.json`, `elcita.json` - Zone leaderboards
- `companies.json` - Company summary data with corporation assignments

### Other Data (`r2/other/`)
- `stats.json` - Overall challenge statistics (people, activities, distance, CO2, fuel, money)
- `registration-stats.json` - Count of registered companies and corporations
- `companies-blr.json` - All Bengaluru companies with coordinates and statistics
- `locations.json` - Map coordinates for corporations and individual companies
### Social (`r2/social/`)
- `index.json` - Social media content index (Instagram posts/reels)
- Media files (`.mp4`, `.jpg`) referenced by the index

## GBA Zones

The Greater Bengaluru Authority is divided into zones used throughout the app:
- **Central** - Central business district
- **South** - Southern Bengaluru
- **East** - Eastern Bengaluru
- **North** - Northern Bengaluru
- **West** - Western Bengaluru
- **ELCITA** - Electronics City Industrial Township Authority
