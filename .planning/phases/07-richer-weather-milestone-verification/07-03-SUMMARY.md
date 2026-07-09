---
phase: 07-richer-weather-milestone-verification
plan: 03
subsystem: state
tags: [pinia, vueuse, useLocalStorage, preferences, composable, typescript]

# Dependency graph
requires:
  - phase: 04-preferences-foundation
    provides: usePreferencesStore with unit/theme/language axes, sanitize() allow-list pattern, useTemperature composable as structural template
provides:
  - windUnit preference axis (kmh/mph) on Preferences/DEFAULT_PREFERENCES, validated identically to unit/theme/language
  - usePreferencesStore.windUnit getter and setWindUnit(w) action, persisted to the weather-prefs localStorage key
  - useWindSpeed composable (kmhToMph pure conversion + { unit, unitSymbol, convert, format }), a drop-in structural mirror of useTemperature
affects: [07-05-weather-card-units, 07-07-settings-wind-toggle]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "New preference axis = 4-point checklist: type union + allow-list const in types/preferences.ts, sanitize() branch + computed getter + setter in stores/preferences.ts"
    - "New display-unit composable = mirror useTemperature.ts's exact shape: pure conversion fn (exported, store-free) + composable returning { unit, unitSymbol, convert, format }"

key-files:
  created:
    - src/composables/useWindSpeed.ts
    - src/__tests__/useWindSpeed.spec.ts
  modified:
    - src/types/preferences.ts
    - src/stores/preferences.ts
    - src/__tests__/preferences.store.spec.ts

key-decisions:
  - "useWindSpeed.format() inserts a space before the unit symbol ('20 km/h'), unlike useTemperature.format() ('21°C') - a degree symbol reads naturally against the number, a two-letter unit does not"
  - "windUnit sanitize branch placed directly after the unit branch in sanitize(), mirroring the field order in the Preferences interface for readability"

requirements-completed: [WTHR-05]

# Metrics
duration: 3min
completed: 2026-07-09
---

# Phase 07 Plan 03: Wind Unit Preference + useWindSpeed Composable Summary

**Added a windUnit (kmh/mph) preference axis with tamper-safe localStorage sanitization, plus a useWindSpeed composable that is a byte-for-byte structural mirror of useTemperature.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-09T12:20:26Z
- **Completed:** 2026-07-09T12:22:13Z
- **Tasks:** 2 completed
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- `windUnit: 'kmh' | 'mph'` is now a fully validated, persisted preference axis with the same guarantees as `unit`/`theme`/`language` (default, setter, sanitize fallback)
- `useWindSpeed()` returns the exact `{ unit, unitSymbol, convert, format }` shape as `useTemperature()`, ready for `WeatherCard` (07-05) and `SettingsPage` (07-07) to consume without further data-layer work
- Both tasks followed full RED/GREEN TDD gates; all new tests written before implementation and confirmed failing first

## Task Commits

Each task was committed atomically (TDD RED/GREEN pairs):

1. **Task 1: Add WindUnit type + Preferences field + store sanitize/getter/setter**
   - `9cd6fe7` test(07-03): add failing tests for windUnit preference axis
   - `19047f3` feat(07-03): add windUnit preference axis with sanitize fallback
2. **Task 2: Create useWindSpeed composable mirroring useTemperature**
   - `df25c34` test(07-03): add failing tests for useWindSpeed composable
   - `4a46ccb` feat(07-03): add useWindSpeed composable mirroring useTemperature

**Plan metadata:** (this commit, immediately following)

_Note: both tasks are TDD - each produced a test commit (RED) then a feat commit (GREEN)._

## Files Created/Modified
- `src/types/preferences.ts` - Added `WindUnit` type, `WIND_UNITS` const, `windUnit` field on `Preferences`/`DEFAULT_PREFERENCES`
- `src/stores/preferences.ts` - Added `windUnit` sanitize branch, `windUnit` computed getter, `setWindUnit()` action
- `src/composables/useWindSpeed.ts` (new) - `kmhToMph()` pure conversion + `useWindSpeed()` composable
- `src/__tests__/preferences.store.spec.ts` - Extended with 3 windUnit assertions/tests (default, setter, tamper fallback)
- `src/__tests__/useWindSpeed.spec.ts` (new) - 4 tests: conversion math, default format, unit-switch format, reactivity

## Decisions Made
- `useWindSpeed().format()` uses a space before the unit symbol (`"20 km/h"`, `"12 mph"`) - differs intentionally from `useTemperature().format()`'s no-space convention (`"21°C"`), because a degree symbol reads naturally attached to the number while a multi-letter unit does not
- No other deviations - plan's structural-mirror instructions for both the store additions and the composable were followed exactly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `npx vue-tsc --noEmit`, `npx eslint` on all touched files, and the full `npx vitest run` suite (43 tests) all pass clean after both tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `windUnit` and `useWindSpeed` are stable, independently-tested data-layer contracts ready for Plan 07-05 (WeatherCard unit display) and Plan 07-07 (Settings wind toggle) to consume
- No UI currently exposes `windUnit` yet, as intended - this plan was pure foundation, verification per `human_verify_mode=end-of-phase` is deferred to end of Phase 07
- No blockers

---
*Phase: 07-richer-weather-milestone-verification*
*Completed: 2026-07-09*

## Self-Check: PASSED

All referenced files and commit hashes verified present on disk / in git log.
