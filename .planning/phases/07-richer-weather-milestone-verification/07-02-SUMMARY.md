---
phase: 07-richer-weather-milestone-verification
plan: 02
subsystem: api
tags: [axios, msw, vitest, open-meteo, typescript]

# Dependency graph
requires:
  - phase: 07-richer-weather-milestone-verification
    provides: "Plan 07-01 dependency install (vuedraggable, @playwright/test) - no direct code dependency, just sequencing"
provides:
  - "Extended CurrentWeather type with feelsLike, precipitation, uvIndex, sunrise, sunset"
  - "fetchCurrentWeather fetching all nine fields in ONE HTTP call (current + daily in same request)"
  - "MSW test coverage asserting the extended request params and response mapping"
  - "cityDetail.spec.ts fixture parity so later UI plans have real data to read"
affects: [07-05-city-detail-current-conditions-panel]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Combine current+daily Open-Meteo params in one request when both are needed from the same call site (avoids a second round trip)"

key-files:
  created: []
  modified:
    - src/types/weather.ts
    - src/lib/openMeteo.ts
    - src/__tests__/openMeteo.spec.ts
    - src/__tests__/cityDetail.spec.ts

key-decisions:
  - "sunrise/sunset fetched via daily block with forecast_days=1 in the SAME request as current conditions - no new HTTP round trip"
  - "precipitation and uvIndex have no unit toggle (mm and 0-11+ scale respectively), matching the existing precipitation convention from HourlyForecast"

patterns-established:
  - "ForecastResponse interface can carry both current and daily blocks when one function needs both from a single call"

requirements-completed: [WTHR-04]

# Metrics
duration: 5min
completed: 2026-07-09
---

# Phase 07 Plan 02: Extend fetchCurrentWeather with richer current-conditions data Summary

**fetchCurrentWeather now returns feels-like temperature, precipitation, UV index, sunrise, and sunset alongside the existing fields, fetched in the same single HTTP call the app already makes.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-09T19:12:49+07:00
- **Completed:** 2026-07-09T19:15:17+07:00
- **Tasks:** 2 completed
- **Files modified:** 4

## Accomplishments
- `CurrentWeather` interface extended with feelsLike, precipitation, uvIndex, sunrise, sunset (9 fields total)
- `fetchCurrentWeather` requests `apparent_temperature,precipitation,uv_index` in `current` and `sunrise,sunset` in `daily`, still exactly ONE `http.get` call
- `openMeteo.spec.ts` asserts both the extended request query params and the extended response mapping; the existing 500-error regression test kept passing unchanged
- `cityDetail.spec.ts`'s `fetchCurrentWeather` mock fixture updated to the extended shape so Plan 07-05's current-conditions panel work has real data to read against

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend fetchCurrentWeather + CurrentWeather with feels-like, precipitation, UV index, sunrise, sunset** - `eb50f42` (feat)
2. **Task 2: Update the cityDetail.spec.ts fetchCurrentWeather fixture to the extended shape** - `743be00` (test)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/types/weather.ts` - `CurrentWeather` gains feelsLike, precipitation, uvIndex, sunrise, sunset fields with inline comments matching the existing DailyForecast/HourlyForecast convention
- `src/lib/openMeteo.ts` - `ForecastResponse` interface extended with apparent_temperature/precipitation/uv_index (current) and a new daily block (sunrise/sunset); `fetchCurrentWeather` extends params (current fields, daily='sunrise,sunset', forecast_days=1, timezone='auto') and return mapping, still one HTTP call
- `src/__tests__/openMeteo.spec.ts` - `fetchCurrentWeather` success test extended to assert new query params and response mapping; error-shape test left unchanged
- `src/__tests__/cityDetail.spec.ts` - `fetchCurrentWeather` mock fixture extended with the five new fields (no assertion changes - deferred to Plan 07-05)

## Decisions Made
- sunrise/sunset use `daily: 'sunrise,sunset'` + `forecast_days: 1` + `timezone: 'auto'` added to the SAME params object as the current-conditions request, matching the plan's requirement of no new round trip.
- precipitation and uvIndex carry no unit-toggle semantics (mm, 0-11+ scale) - consistent with how HourlyForecast's precipitation field is already documented.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data-layer foundation for WTHR-04 is complete and stable: `fetchCurrentWeather` and `CurrentWeather` carry all nine fields, verified against the live-verified Open-Meteo response shape.
- Plan 07-05 (CityDetailPage current-conditions panel) can now build UI against the real extended fields; `cityDetail.spec.ts`'s fixture already matches the real return shape, so no fixture rework will be needed when that plan adds assertions.
- Full test suite green (37/37 tests, 10 test files) after both tasks.

## Self-Check: PASSED

All modified files found on disk (src/types/weather.ts, src/lib/openMeteo.ts, src/__tests__/openMeteo.spec.ts, src/__tests__/cityDetail.spec.ts). All task commits found in git log (eb50f42, 743be00).

---
*Phase: 07-richer-weather-milestone-verification*
*Completed: 2026-07-09*
