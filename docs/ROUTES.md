# Routes & Pages

## Layout Chain

### Root Layout (`+layout.svelte`)
- Imports global CSS (`app.css`) and i18n
- Renders `GoToTop` floating button
- Handles scroll-to-top on navigation (except hash links)

### Root Client Layout (`+layout.ts`)
- Awaits i18n initialization before rendering any page

---

## Pages

### `/` - Landing Page (`+page.svelte`)
**Purpose:** Pre-registration landing page for Hejje Gala challenge.

**Components used:**
- `Hero` - Banner with CTA button, org logos
- `Calendar` - Challenge event calendar
- `Welcome` - About section with description
- `Stats` - Challenge statistics (CO2 offset, fuel saved, users, distance)
- `SocialActivity` - Instagram social media feed
- `FooterCTA` - Call-to-action registration banner
- `Footer` - Site footer with links
- `GbaLetterButton` - Floating button to download GBA letter PDF

**State:** Tracks `isMobile` via resize listener (breakpoint: 1280px).

---

### `/leaderboard` - Leaderboard (`+page.svelte`, `+page.server.ts`)
**Purpose:** Multi-level leaderboard with city > corporation > company drill-down.

**Three views (controlled by URL params):**
1. **City view** (default, no params) - Shows corporation leaderboard + all-company leaderboard
2. **Corporation view** (`?view=corporation&corp={id}`) - Shows companies within a zone with filter tabs
3. **Company view** (`?view=company&corp={id}&company={id}`) - Shows employee leaderboard, map, social activity

**Data sources:** Fetches leaderboard JSON from `assets.hejjegala.in/leaderboard/`.

**Components:** Hero (compact), Leaderboard, CompanyStats, Map, SocialActivity, Footer.

---

### `/register` - Registration Page (`+page.svelte`)
**Purpose:** Company registration form for the Hejje Gala challenge.

**Components:** Header, GooglePlacesAutocomplete, Button, Input, Label, Modal.

**Features:**
- Company search with autocomplete from local JSON data
- New company registration with Google Places address lookup
- Submits to `/api/register` server endpoint (proxies to Altmo API)
- Success/error modal feedback

**State:** Tracks `isMobile` via resize listener (breakpoint: 1280px).

---

### `/activities` - Activities Page (`+page.svelte`)
**Purpose:** Activities section for the challenge.

**Components:** Header, Activities, Footer.

**State:** Tracks `isMobile` via resize listener (breakpoint: 1280px).

---

### `/calendar` - Calendar Page (`+page.svelte`)
**Purpose:** Challenge event calendar.

**Components:** Header, Calendar, Footer.

**State:** Tracks `isMobile` via resize listener (breakpoint: 1280px).

---

### `/champions` - Champions Page (`+page.svelte`)
**Purpose:** Champions section highlighting top participants.

**Components:** Header, Champions, Footer.

**State:** Tracks `isMobile` via resize listener (breakpoint: 1280px).

---

### `/about` - About Page (`+page.svelte`)
**Purpose:** Information about the Hejje Gala challenge.

**Components:** Hero (compact), WhatIsHejjeGala, WhyHejjeGala, AboutFAQs, FooterCTA, Footer.

---

## API Endpoints

### `POST /api/register` (`+server.ts`)
**Purpose:** Server-side proxy for company registration via the Altmo API.

**Accepts:** JSON body with organisation name, representative details, employee count, and optional location coordinates.

**Uses:** `ALTMO_DOMAIN`, `ALTMO_API_KEY`, `ALTMO_CHALLENGE_ID`, `ALTMO_CITY_ID` environment variables.

---
