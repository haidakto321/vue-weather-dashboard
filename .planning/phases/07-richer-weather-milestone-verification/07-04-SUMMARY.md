---
phase: 07-richer-weather-milestone-verification
plan: 04
subsystem: ui
tags: [vueuse, useGeolocation, geolocation, vue-i18n, pinia, vitest]

# Dependency graph
requires:
  - phase: 07-richer-weather-milestone-verification (plan 01-03)
    provides: vuedraggable/@playwright/test approved deps, WTHR-04 richer current conditions, WTHR-05 wind-unit axis - none consumed directly by this plan, but establish the same composable/i18n conventions followed here
provides:
  - useMyLocation composable - one-shot geolocation fix (locate/locating/errorKind) wired to cities store
  - GeolocationButton.vue - self-contained "use my location" button + error alert, not yet wired into any page
  - geo.* i18n keys (myLocation/useMyLocation/denied/unavailable/unsupported) in en.ts and ja.ts
affects: [07-06 (wires GeolocationButton into DashboardPage.vue)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useGeolocation({ immediate: false }) + pause() on first fix/error to turn a continuous watchPosition into a one-shot fix"
    - "Static i18n label ('My Location') instead of reverse geocoding - Open-Meteo has no lat/lon -> place-name endpoint"
    - "id: 0 sentinel relies on cities store's existing cityKey() lat,lon,name composite fallback for dedupe"

key-files:
  created:
    - src/composables/useMyLocation.ts
    - src/components/GeolocationButton.vue
    - src/__tests__/useMyLocation.spec.ts
  modified:
    - src/i18n/messages/en.ts
    - src/i18n/messages/ja.ts

key-decisions:
  - "Static 'My Location' label used instead of any place-name lookup - Open-Meteo has no reverse-geocoding endpoint (confirmed in 07-RESEARCH.md); no third-party geocoder added per the Open-Meteo-only constraint"
  - "GeolocationButton.vue and useMyLocation.ts are deliberately NOT wired into any page in this plan - kept isolated and independently testable; Plan 07-06 wires the button into DashboardPage.vue"

patterns-established:
  - "One-shot geolocation fix pattern: watch [coords, error], guard with Number.isFinite (not truthiness, since coords starts at Infinity), call pause() on the first real result"

requirements-completed: [GEO-01]

# Metrics
duration: 5min
completed: 2026-07-09
---

# Phase 07 Plan 04: Geolocation "Use My Location" Summary

**useMyLocation composable wraps VueUse's useGeolocation into a one-shot fix (pause() on first coords/error) that adds a static, i18n-labeled "My Location" city to the store - no reverse geocoding, since Open-Meteo has none.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-09T19:26:00+07:00 (approx, from prior plan's commit)
- **Completed:** 2026-07-09T19:30:27+07:00
- **Tasks:** 2
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- `useMyLocation()` composable: `locate()` triggers a one-shot geolocation fix (continuous `watchPosition` is paused immediately on the first fix or error, avoiding an indefinite location-indicator/battery drain)
- Success path adds a `SavedCity` with `id: 0` / `name: 'My Location'` directly via `store.addCity` - no reverse geocoding, matching the confirmed Open-Meteo constraint
- Three distinct, i18n-keyed failure states: `denied` (code 1), `unavailable` (code 2/3), `unsupported` (no Geolocation API at all)
- `GeolocationButton.vue`: self-contained button + inline error alert, fully i18n-keyed, `data-testid="geo-button"`, not yet wired into any page
- `geo.*` i18n block added to both `en.ts` and `ja.ts` with full parity (enforced by `i18nParity.spec.ts`)
- Composable-level test covers all four paths (success/denied/unavailable/unsupported) against a jsdom `navigator.geolocation` shim

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useMyLocation composable (one-shot fix + denied/unavailable/unsupported mapping)** - `8486ad2` (feat)
2. **Task 2: Create GeolocationButton.vue + geo.* i18n keys (en/ja parity)** - `16a949a` (feat)

**Plan metadata:** committed as part of this summary commit below.

## Files Created/Modified

- `src/composables/useMyLocation.ts` - one-shot geolocation fix; exports `MyLocationErrorKind` type and `useMyLocation(): { locating, errorKind, locate }`
- `src/__tests__/useMyLocation.spec.ts` - four tests (success, denied, unavailable, unsupported) against a jsdom geolocation shim
- `src/components/GeolocationButton.vue` - `data-testid="geo-button"` button + `errorKind`-driven `v-alert`, fully i18n-keyed
- `src/i18n/messages/en.ts` - new `geo` block (5 keys) + file-header comment updated to list `geo`
- `src/i18n/messages/ja.ts` - matching `geo` block with natural Japanese values

## Decisions Made

- Static "My Location" label chosen over the timezone-derived-name option raised in 07-RESEARCH.md (Open Question 1) - simplest, always accurate, zero extra HTTP requests, matches the user-confirmed resolution
- `id: 0` sentinel deliberately reuses the cities store's existing `cityKey()` fallback (`lat,lon,name` composite) for dedupe - no store change needed for this plan; the `id: 0` cross-fix collision risk (Pitfall 4 in RESEARCH, routing by `city.id` vs `city.key`) is explicitly out of scope here since `WeatherCard.vue` is untouched by this plan

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched their `<action>` specs; all acceptance criteria and automated verification commands passed without modification.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Geolocation permission prompts are a browser-native runtime behavior, not a setup step.

## Next Phase Readiness

- `useMyLocation` and `GeolocationButton.vue` are complete, tested, and ready for Plan 07-06 to import into `DashboardPage.vue` once `vuedraggable` is installed (Plan 07-01)
- `DashboardPage.vue` remains untouched by this plan, as specified
- No blockers for downstream plans

---
*Phase: 07-richer-weather-milestone-verification*
*Completed: 2026-07-09*

## Self-Check: PASSED

All created files and commit hashes verified present on disk / in git history.
