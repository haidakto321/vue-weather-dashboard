---
phase: 06-localized-theme-aware-charts
plan: 02
subsystem: ui
tags: [vue, chartjs, vue-chartjs, mixed-chart, vue-query, vue-i18n, theming, hourly-forecast]

# Dependency graph
requires:
  - phase: 06
    plan: 01
    provides: theme-reactive chart options + :key remount pattern, the `chart` i18n block
  - phase: 05
    provides: two-tier data split (axios http layer -> reactive Vue Query composable), MSW test harness
provides:
  - fetchHourlyForecast API fn + HourlyForecast type (24-point hourly window, forecast_days=1)
  - useHourlyForecast reactive composable (MaybeRefOrGetter city + DATA-04 enabled guard)
  - HourlyChart.vue mixed line+bar chart (temperature line left axis, precipitation bars right axis)
  - chart.temperature / chart.precipitation / detail.hourlyHeading i18n keys (en + ja parity)
affects: [city detail page, i18n message parity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mixed Chart.js chart via base <Chart type='bar'> + per-dataset type overrides (line + bar)"
    - "Register BOTH BarController AND LineController for a mixed chart (Pitfall 4)"
    - "Dual y-axis: temperature on left (y), precipitation on right (y1, drawOnChartArea:false)"
    - "Unit toggle applies to temperature only; precipitation stays mm (Pitfall 8)"

key-files:
  created:
    - src/composables/useHourlyForecast.ts
    - src/components/HourlyChart.vue
  modified:
    - src/lib/openMeteo.ts
    - src/types/weather.ts
    - src/pages/CityDetailPage.vue
    - src/__tests__/openMeteo.spec.ts
    - src/__tests__/cityDetail.spec.ts
    - src/i18n/messages/en.ts
    - src/i18n/messages/ja.ts

key-decisions:
  - "forecast_days=1 (24 points) keeps the hourly chart readable rather than a dense multi-day strip (Pitfall 5)"
  - "Precipitation is exempt from the unit toggle - mm only, on its own right y1 axis (Pitfall 8)"
  - "Reused the SAME resolved `city` computed as useForecast so the untrusted route :id never feeds the request (T-06-03)"

patterns-established:
  - "Mixed line+bar Chart.js chart: base Chart component + per-dataset type, dual controllers, dual axes"

requirements-completed: [CHRT-05]

# Metrics
duration: 3min
completed: 2026-07-08
---

# Phase 6 Plan 02: Localized Theme-Aware Hourly Chart Summary

**The city detail page now shows a mixed hourly chart - a unit-aware temperature line on the left axis over precipitation bars (mm) on the right axis - fed by a new reactive Vue Query composable that re-fetches on city change and carries the same theme/locale reactivity as ForecastChart.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-08T13:59:55Z
- **Completed:** 2026-07-08T14:03:05Z
- **Tasks:** 2
- **Files created:** 2
- **Files modified:** 7

## Accomplishments
- Extended the API layer with `fetchHourlyForecast(latitude, longitude, signal?)` reusing the shared axios `http` client + `FORECAST_URL`, requesting `hourly=temperature_2m,precipitation` + `forecast_days=1` + `timezone=auto` via the params object (never string-concatenated - T-06-04), with a locally-typed `HourlyForecastResponse` (no `any` - T-06-05).
- Added the `HourlyForecast` parallel-array type (`times`/`temperature`/`precipitation`) mirroring `DailyForecast`.
- Created `useHourlyForecast(city)` as a direct sibling of `useForecast`: computed `['hourly', key]` queryKey, re-check-and-throw queryFn, `enabled: computed(() => !!toValue(city))`, 5-min staleTime (DATA-04 guard verbatim).
- Built `HourlyChart.vue`: base `Chart` component with `type="bar"`, registers BOTH `BarController` + `LineController` (+ elements/scales - Pitfall 4), temperature line dataset (`type:'line'`, `yAxisID:'y'`, mapped through `convert`) and precipitation bar dataset (`type:'bar'`, `yAxisID:'y1'`, NOT converted - Pitfall 8). Theme-reactive `chartOptions` computed + `:key` remount, same discipline as ForecastChart.
- Wired `useHourlyForecast(city)` into CityDetailPage using the SAME resolved `city` computed as `useForecast`, rendering `<HourlyChart v-if="hourly">` under a `t('detail.hourlyHeading')` heading in the temperature column.
- Added `chart.temperature` / `chart.precipitation` / `detail.hourlyHeading` to both en.ts and ja.ts (parity).
- Added MSW hourly tests (params + normalization + error shape) and extended the cityDetail spec mock with `fetchHourlyForecast` plus a hourly-chart container assertion.

## Task Commits

Each task was committed atomically:

1. **Task 1: Hourly data layer - API fn + type + composable + MSW test** - `5446e02` (feat)
2. **Task 2: HourlyChart mixed component + CityDetailPage wiring + i18n keys** - `834c1b9` (feat)

## Files Created/Modified
- `src/lib/openMeteo.ts` - added `HourlyForecastResponse` interface + `fetchHourlyForecast`.
- `src/types/weather.ts` - added `HourlyForecast` parallel-array interface.
- `src/composables/useHourlyForecast.ts` (NEW) - reactive hourly query composable with DATA-04 enabled guard.
- `src/components/HourlyChart.vue` (NEW) - mixed line+bar chart, dual controllers, dual y-axes, theme + i18n + unit reactive.
- `src/pages/CityDetailPage.vue` - imports + wires `useHourlyForecast(city)` and mounts `HourlyChart` under the temperature chart.
- `src/i18n/messages/en.ts` / `src/i18n/messages/ja.ts` - `chart.temperature`, `chart.precipitation`, `detail.hourlyHeading` (parity).
- `src/__tests__/openMeteo.spec.ts` - new `fetchHourlyForecast` MSW block.
- `src/__tests__/cityDetail.spec.ts` - `fetchHourlyForecast` mock + hourly-chart container assertion.

## Decisions Made
- `forecast_days=1` (24 points) instead of a multi-day hourly window so the chart stays legible (Pitfall 5).
- Precipitation bars live on their own right-hand `y1` axis with `drawOnChartArea:false` and are never unit-converted - the temperature toggle only affects the temperature line/left axis (Pitfall 8).
- The hourly composable takes the SAME resolved `city` computed as `useForecast`; the raw route `:id` is never threaded into the request, only the looked-up city's stored lat/lon (T-06-03).

## Deviations from Plan

None - plan executed exactly as written.

## Threat Model Coverage
- T-06-03 (route :id tampering): mitigated - `useHourlyForecast(city)` fed the resolved `city` computed, request uses stored lat/lon only.
- T-06-04 (param injection): mitigated - all query values passed via the axios `params` object.
- T-06-05 (malformed response): mitigated - locally-typed `HourlyForecastResponse` (no `any`); `v-if="hourly"` hides the chart on empty/error state.
- T-06-06 (XSS): mitigated - Chart.js renders labels to a canvas; static i18n text; no `v-html`.

## Issues Encountered
None. `npx vitest run` (36 tests pass), `npx vue-tsc --build` (exit 0), and `npm run build` (exit 0) all pass. The pre-existing `@vueuse/core` `#__PURE__` annotation warnings from the vendored bundle are out of scope and unchanged by this plan.

## User Setup Required
None - no external service configuration required. Human-check available: run `npm run dev`, open a city detail page, confirm the hourly chart renders under the temperature chart; toggle the temperature unit (line/axis switch units, precipitation bars stay); navigate to another saved city (chart updates).

## Next Phase Readiness
- CHRT-05 complete. The mixed line+bar dual-axis chart pattern is now established for any future multi-metric chart.
- No blockers.

## Self-Check: PASSED

All created/modified files and both task commits (5446e02, 834c1b9) verified present on disk / in git history.

---
*Phase: 06-localized-theme-aware-charts*
*Completed: 2026-07-08*
