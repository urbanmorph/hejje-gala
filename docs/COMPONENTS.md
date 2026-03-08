# Components Reference

## Landing Page Components (`src/lib/components/landing/`)

All landing components accept an `isMobile` prop (boolean, breakpoint at 1280px) for responsive layout.

### Hero (`Hero.svelte`)
Main banner/header section displayed on every page.

**Props:**
- `isMobile` - Responsive flag
- `title?` - Override title text (defaults to config)
- `showCTA?` - Show register CTA button (default: true)
- `compact?` - Compact mode for inner pages (default: false)
- `disabledLabels?` - Set of nav labels to disable
- `postRegistration?` - Post-registration mode (default: false)
**Contains:** Header, CTAButton, OrganizationLogos.

### Header (`Header.svelte`)
Sticky navigation bar with logo, nav links, language switcher, and register button.

**Features:**
- Scroll-based visibility (hides after 2% viewport scroll)
- Language toggle (EN/KN) persisted to localStorage
- Mobile hamburger menu
- Navigation links from `landing.ts` config

### Welcome (`Welcome.svelte`)
About/welcome section with description text and "Know More" CTA.

### Stats (`Stats.svelte`)
Statistics display showing CO2 offset, fuel saved, active users, distance covered.

**Data:** Fetches from `https://assets.hejjegala.in/other/stats.json` and animates numbers.

**Contains:** AnimatedNumber components.

### AnimatedNumber (`AnimatedNumber.svelte`)
Animates a number from 0 to target value with easing. Triggers when element enters viewport via IntersectionObserver.

### WhatIsHejjeGala (`WhatIsHejjeGala.svelte`)
Detailed explanation of the challenge with i18n support.

### WhyHejjeGala (`WhyHejjeGala.svelte`)
Reasons to participate section.

### AboutFAQs (`AboutFAQs.svelte`)
Accordion FAQ section with expandable questions/answers. Content from i18n locale files.

### SocialActivity (`SocialActivity.svelte`)
Instagram feed section showing social media content (images and videos).

**Data:** Fetches from `https://assets.hejjegala.in/social/index.json`.

**Props:** `entityName?` - Name to display in the section title.

### Leaderboard (`Leaderboard.svelte`)
Tabular leaderboard component with search, filters, and sorting.

**Props:**
- `dataUrl` - URL to fetch leaderboard JSON
- `initialFilter` - Default activity filter
- `showSearch` - Toggle search bar
- `showFilters` - Toggle filter tabs
- `context` - "city" or "corporation" (affects navigation)

**Features:**
- Activity type tabs (cycling, walking, transit)
- Purpose tabs (recreation, commute)
- Search filtering
- Click-through to corporation/company views

### CompanyStats (`CompanyStats.svelte`)
Employee leaderboard table for a specific company.

**Props:**
- `dataUrl` - URL to employee leaderboard JSON
- `companyId` - Company identifier

### Map (`Map.svelte`)
MapLibre GL map showing transport infrastructure and company/zone boundaries.

**Props:**
- `selectedCorpId?` - Corporation zone to highlight
- `selectedCompanyId?` - Company to highlight
- `name?` - Name to display

**Features:**
- Loads KML boundaries for GBA zones
- Renders bus routes, metro lines, cycle paths from GeoJSON
- Company location markers
- Toggleable layers (bus, metro, cycling)
- Corporation coordinate presets from locations.json

### Footer (`Footer.svelte`)
Site footer with navigation links, social media icons, and partner logos.

**Props:**
- `disabledLabels?` - Set of nav labels to hide

### FooterCTA (`FooterCTA.svelte`)
Call-to-action banner for registration with gradient background.

### CTAButton (`CTAButton.svelte`)
Styled "REGISTER NOW" button component.

### AppStoreButtons (`AppStoreButtons.svelte`)
App Store and Play Store download buttons for the Altmo app.

### OrganizationLogos (`OrganizationLogos.svelte`)
Partner organization logos (Altmo, WRI India, GBA, Walkaluru).

### OrbitalRing (`OrbitalRing.svelte`)
Decorative animated orbital ring graphic on the hero section.

### SocialIcons (`SocialIcons.svelte`)
Social media icon links.

### InstagramIcon (`InstagramIcon.svelte`)
SVG Instagram icon component.

### AssetCard (`AssetCard.svelte`)
Card component for displaying social media assets.

### Activities (`Activities.svelte`)
Activities section for the challenge.

### Calendar (`Calendar.svelte`)
Challenge event calendar section.

### Champions (`Champions.svelte`)
Champions section highlighting top participants.

### `index.ts`
Barrel export for landing components.

---

## Shared Components (`src/lib/components/`)

### GoToTop (`GoToTop.svelte`)
Floating "scroll to top" button that appears after scrolling down.

### GbaLetterButton (`GbaLetterButton.svelte`)
Floating button to download the GBA CC Letter PDF (`/GBA_CC_Letter_Companies.pdf`).

### GooglePlacesAutocomplete (`GooglePlacesAutocomplete.svelte`)
Google Places autocomplete input for address lookup during registration.

---

## UI Components (`src/lib/components/ui/`)

Built with shadcn-svelte (New York variant). Each has an `index.ts` barrel export.

### Button (`button/Button.svelte`)
Standard button with variants: default, destructive, outline, secondary, ghost, link.
Sizes: default, sm, lg, icon.

### Input (`input/Input.svelte`)
Text input with standard styling.

### Label (`label/Label.svelte`)
Form label component.

### Modal (`modal/Modal.svelte`)
Modal dialog with Lottie animation support.

**Props:**
- `open` - Visibility state
- `onClose` - Close callback
- `title` - Modal title
- `message` - Modal message
- `buttonText` - Action button text
- `lottieSrc?` - Lottie animation URL
- `confettiSrc?` - Confetti animation URL
