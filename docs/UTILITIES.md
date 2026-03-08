# Utilities & Services

## General Utilities (`src/lib/utils/index.ts`)

| Function | Purpose |
|----------|---------|
| `formatNumber(num)` | Formats with Intl.NumberFormat (e.g., `1,000,000`) |
| `getTimeRemaining(targetDate)` | Returns `{ days, hours, minutes, seconds, isExpired }` |
| `smoothScrollTo(elementId)` | Smooth scroll to DOM element |
| `formatDate(date)` | Formats to "Month Day, Year" |
| `truncate(text, length)` | Truncates text with ellipsis |
| `isInViewport(element)` | Checks if element is within viewport bounds |
| `isMobile()` | Returns `true` if `window.innerWidth < 1280` |
| `isDesktop()` | Returns `true` if `window.innerWidth >= 1280` |

## Google Maps Utilities (`src/lib/utils/googleMaps.ts`)

| Function | Purpose |
|----------|---------|
| `initializeGoogleMaps(options)` | Initializes Google Maps Places API with singleton pattern; returns `PlaceAutocomplete` component and initialization status |

Used by `GooglePlacesAutocomplete` component for address lookup during registration.

## shadcn Utilities (`src/lib/utils.ts`)

| Export | Purpose |
|--------|---------|
| `cn(...inputs)` | Tailwind class merge utility (clsx + twMerge) |
| `WithoutChild<T>` | Type helper - removes `child` prop |
| `WithoutChildren<T>` | Type helper - removes `children` prop |
| `WithoutChildrenOrChild<T>` | Combined type helper |
| `WithElementRef<T, U>` | Type helper - adds `ref` prop |
| `isMobile()` / `isDesktop()` | Duplicated viewport checks |

## Scroll Hook (`src/lib/hooks/useScrollVisibility.svelte.ts`)

Svelte 5 composable that tracks scroll position and viewport height.

```typescript
const { isVisible } = useScrollVisibility();
// isVisible becomes false after scrolling > 2% of viewport height
```

Used by the Header component for sticky show/hide behavior.

## i18n (`src/lib/i18n/index.ts`)

Internationalization setup using `svelte-i18n`.

- **Locales:** English (`en`) and Kannada (`kn`)
- **Default:** English (falls back if navigator locale isn't Kannada)
- **Persistence:** Locale choice saved to `localStorage` under key `locale`
- **Locale files:** `src/lib/i18n/locales/en.json`, `src/lib/i18n/locales/kn.json`
- **Usage:** `$_('key.path')` in components

## Landing Config (`src/lib/config/landing.ts`)

Centralized configuration for all landing page content:

| Export | Contents |
|--------|----------|
| `siteConfig` | Site name, title, description |
| `navigation` | Nav link items (Home, Leaderboard, About, FAQs) |
| `heroConfig` | Hero title, countdown date, CTA text/link, powered-by logos |
| `welcomeConfig` | Welcome section title, description, CTA |
| `statsConfig` | Metrics configuration (CO2, fuel, users, distance) with icons |
| `testimonialsConfig` | Testimonial quotes |
| `citySectionConfig` | City/Corporation/Company view mode descriptions |
| `footerCTAConfig` | Footer CTA content |
| `footerConfig` | Footer links and social media |

**Types exported:** `StatsMetricKey`, `CityViewMode`

---

## Data Models

### Company
```typescript
{
  id: number;
  name: string;
  address: string;
  empCount: number;
  latitude: number;
  longitude: number;
  statistics: {
    employeesCount: number;
    activitiesCount: number;
    distance: number;      // meters
    co2Offset: number;     // kg
    fuelSaved: number;     // liters
    moneySaved: number;    // INR
  };
  campusNames?: string[];
  campusIds?: number[];
}
```

### LeaderboardRow
```typescript
{
  rank: number;
  companyId: string;
  name: string;
  activities: number;
  co2OffsetKg: number;
  fuelSavedL: number;
  moneySaved: number;
  employees: number;
  score: number;
  sector: string;
  location: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  corporationId: string;
  corporationName: string;
}
```

### CorporationLeaderboard
```typescript
{
  corporationId: string;
  corporationName: string;
  city: string;
  dimensions: {
    recreationAll?: { rows: LeaderboardRow[] };
    recreationWalk?: { rows: LeaderboardRow[] };
    recreationCycle?: { rows: LeaderboardRow[] };
    commuteAll?: { rows: LeaderboardRow[] };
    commuteWalk?: { rows: LeaderboardRow[] };
    commuteCycle?: { rows: LeaderboardRow[] };
    transitAll?: { rows: LeaderboardRow[] };
    transitWalk?: { rows: LeaderboardRow[] };
    transitCycle?: { rows: LeaderboardRow[] };
  };
}
```

### Social Asset
```typescript
{
  url: string;        // relative filename
  type: "video" | "image";
  socialUrl: string;  // Instagram URL
  author: string;     // Instagram handle
}
```

### Overall Statistics
```typescript
{
  success: boolean;
  overall_statistics: {
    people: number;
    activitiesCount: number;
    distance: number;          // meters
    co2Offset: number;         // kg
    fuelSaved: number;         // liters
    moneySaved: number;        // INR
  };
}
```
