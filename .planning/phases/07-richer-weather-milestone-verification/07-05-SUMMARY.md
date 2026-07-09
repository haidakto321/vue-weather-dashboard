---
phase: 07-richer-weather-milestone-verification
plan: 05
subsystem: ui
tags: [vue3, vue-i18n, tanstack-query, vuetify, vue-router]

# Dependency graph
requires:
  - phase: 07-02 (richer current-weather fetch)
    provides: "CurrentWeather.feelsLike/precipitation/uvIndex/sunrise/sunset fields"
  - phase: 07-03 (wind unit toggle)
    provides: "useWindSpeed() composable mirroring useTemperature()"
  - phase: 07-04 (geolocation use-my-location)
    provides: "geo.myLocation i18n key and id:0 geolocation SavedCity entries"
provides:
  - "CityDetailPage current-conditions panel (data-testid=current-conditions)"
  - "WeatherCard richer fields + wind-unit-aware wind reading + last-updated/refresh + testid"
  - "WeatherCard routes by city.key instead of city.id (fixes id:0 collision across geolocation cities)"
  - "card.feelsLike/precipitation/uvIndex/sunrise/sunset/lastUpdated/refresh + detail.currentHeading i18n keys (en/ja)"
affects: [07-06 (multi-geolocation-city ordering), 07-08 (e2e smoke test using weather-card testid)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Current-conditions panel reuses the exact useCurrentWeather/wmoToCondition/useTemperature/useWindSpeed rendering pattern already established in WeatherCard, applied identically to CityDetailPage"
    - "dataUpdatedAt/isRefetching from useQuery drive a last-updated label + refresh button with zero new fetch logic (Vue Query already tracks both)"
    - "displayName computed (city.id === 0 ? t('geo.myLocation') : city.name) as the render-site pattern for the geolocation city label, applied on both WeatherCard and CityDetailPage"

key-files:
  created:
    - src/__tests__/weatherCard.spec.ts
  modified:
    - src/pages/CityDetailPage.vue
    - src/components/WeatherCard.vue
    - src/i18n/messages/en.ts
    - src/i18n/messages/ja.ts
    - src/__tests__/cityDetail.spec.ts

key-decisions:
  - "card.wind i18n key changed to '{value} {unit}' for parity with chart.tempHigh's parameterized convention, even though this plan's call sites render wind via useWindSpeed().format() directly rather than through the key (kept for consistency/future direct use)"
  - "Current-conditions panel placed inside CityDetailPage's existing forecast v-else-if block (not as a sibling before it) - Vue's v-if/v-else-if chain requires immediately-adjacent siblings, so the new loading/error/content sub-branches nest one level deeper instead of interrupting the outer chain"

patterns-established:
  - "Pattern: a second independent Vue Query result (own isPending/isError/content branches) can render inside an already-successful v-else-if branch of a different query, so a slow/failed secondary fetch never blocks the primary content"

requirements-completed: [WTHR-04, WTHR-05, DATA-06]

# Metrics
duration: 25min
completed: 2026-07-09
---

# Phase 07 Plan 05: Richer Current Conditions + Last-Updated/Refresh Summary

**CityDetailPage gained a full current-conditions panel (feels-like/precipitation/UV/sunrise/sunset) and WeatherCard gained the same fields plus a unit-aware wind reading, a last-updated/refresh row, and a route-by-key fix for geolocation cities.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-09T12:18:00Z
- **Completed:** 2026-07-09T12:43:46Z
- **Tasks:** 2 completed
- **Files modified:** 6 (1 new test file, 5 edited)

## Accomplishments
- CityDetailPage now shows a `data-testid="current-conditions"` panel with its own loading/error/content branches, wired to `useCurrentWeather(city)` - previously the detail page showed zero current-conditions data (WTHR-04)
- WeatherCard's wind reading now goes through `useWindSpeed().format()` instead of a hard-coded `km/h` string, completing WTHR-05's card-side wiring
- Both surfaces show a last-updated time (from `dataUpdatedAt`) and a manual-refresh button (via `refetch()`/`isRefetching`) in their content branch, not just the error branch (DATA-06)
- Fixed the WeatherCard routing bug where every geolocation-added city (`id: 0`) collided on `/city/0` - now routes by the globally-unique `city.key`
- Both surfaces show the localized "My Location" label instead of the raw stored name for the geolocation city (`id === 0`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add richer-conditions i18n keys + CityDetailPage current-conditions panel** - `46ae708` (feat)
2. **Task 2: Extend WeatherCard with richer fields, wind unit, last-updated/refresh, route-by-key fix, testid** - `cc9ab65` (feat)

**Plan metadata:** (pending - see below)

## Files Created/Modified
- `src/pages/CityDetailPage.vue` - new current-conditions panel with its own loading/error/content branches; `currentCondition`/`lastUpdatedLabel`/`displayName` computeds; `formatTime` helper
- `src/components/WeatherCard.vue` - richer content branch (feelsLike/precipitation/uvIndex/sunrise/sunset), last-updated/refresh row, `data-testid="weather-card"`, route-by-`city.key`, `displayName` computed, wind reading via `useWindSpeed`
- `src/i18n/messages/en.ts` / `ja.ts` - `card.feelsLike/precipitation/uvIndex/sunrise/sunset/lastUpdated/refresh`, `detail.currentHeading`; `card.wind` parameterized to `'{value} {unit}'`
- `src/__tests__/weatherCard.spec.ts` (new) - richer-field rendering, route-by-key regression (two id:0 cities get distinct hrefs), refresh-button refetch
- `src/__tests__/cityDetail.spec.ts` - extended to assert the new current-conditions panel renders

## Decisions Made
- `card.wind` key parameterized to `'{value} {unit}'` for i18n consistency with `chart.tempHigh`, even though this plan's WeatherCard/CityDetailPage call sites bypass the key and call `useWindSpeed().format()` directly (that helper already returns a complete unit-suffixed string)
- CityDetailPage's current-conditions panel nests inside the existing `<template v-else-if="forecast">` block rather than sitting as a sibling before it, to keep Vue's v-if/v-else-if chain contiguous (see Deviations)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Moved current-conditions panel inside the forecast v-else-if block instead of before it**
- **Found during:** Task 1 verification (`npx vitest run cityDetail.spec.ts`)
- **Issue:** The plan's literal instruction ("insert directly above the existing `<v-row>` forecast block") was implemented as a sibling block placed BEFORE `<template v-else-if="forecast">`, breaking Vue's v-if/v-else-if/v-else chain (which requires immediately-adjacent siblings with no other elements in between). This caused `forecast-list`/`forecast-chart`/`hourly-chart` test-ids to stop rendering entirely - `list.exists()` failed.
- **Fix:** Moved the current-conditions panel's markup (heading + progress-circular/alert/card triplet) to be the first children INSIDE `<template v-else-if="forecast">`, directly above the pre-existing `<v-row>` - satisfying the plan's actual intent (panel above the forecast row) without breaking the outer if-chain.
- **Files modified:** src/pages/CityDetailPage.vue
- **Verification:** `npx vitest run cityDetail.spec.ts i18nParity.spec.ts` passes; `npm run build` succeeds
- **Committed in:** 46ae708 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed weatherCard.spec.ts href assertions for URL-encoded keys**
- **Found during:** Task 2 verification (`npx vitest run weatherCard.spec.ts`)
- **Issue:** The route-by-key regression test's geolocation-city fixtures used keys containing spaces (e.g. `"51.5,-0.1,My Location"`); vue-router's generated `href` percent-encodes the space (`%20`) but not the commas, so a raw `toContain(key)` assertion failed.
- **Fix:** Compare against `key.replace(/ /g, '%20')` instead of the raw key.
- **Files modified:** src/__tests__/weatherCard.spec.ts
- **Verification:** `npx vitest run weatherCard.spec.ts` - all 4 tests pass
- **Committed in:** cc9ab65 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bugs found and fixed during the plan's own verification step, before either task commit)
**Impact on plan:** Both fixes were necessary to make the plan's own described behavior work correctly (a broken Vue template chain and a test assertion bug); no scope creep, no plan intent changed.

## Issues Encountered
None beyond the two auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- WTHR-04 and DATA-06 are fully implemented on both `WeatherCard.vue` and `CityDetailPage.vue`; WTHR-05's card-side wiring is complete (Settings-page side is Plan 07-07)
- The `city.key`-based routing fix is in place before Plan 07-06 introduces multiple geolocation cities via drag-reorder, preventing the id:0 collision bug from ever being user-visible
- `data-testid="weather-card"` is now available for Plan 07-08's Playwright e2e smoke test
- Full test suite (13 files, 50 tests) and `npm run build`/`npm run lint` all pass with these changes in place

---
*Phase: 07-richer-weather-milestone-verification*
*Completed: 2026-07-09*

## Self-Check: PASSED

All created/modified files exist on disk (CityDetailPage.vue, WeatherCard.vue, weatherCard.spec.ts,
en.ts, ja.ts) and both task commits (46ae708, cc9ab65) are present in git history.
