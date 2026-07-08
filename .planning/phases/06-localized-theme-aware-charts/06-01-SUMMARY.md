---
phase: 06-localized-theme-aware-charts
plan: 01
subsystem: ui
tags: [vue, chartjs, vue-chartjs, vuetify, vue-i18n, theming, i18n, forecast-chart]

# Dependency graph
requires:
  - phase: 05
    provides: vue-i18n v11 message catalogues (en/ja) and the existing forecast chart
provides:
  - Theme-reactive ForecastChart chrome (axis text, grid, legend follow the active Vuetify theme)
  - i18n-keyed chart dataset labels (chart.tempHigh / chart.tempLow) with {unit} interpolation
  - Locale-formatted x-axis dates (toLocaleDateString via dateLocale) matching ForecastList
affects: [06-02-hourly-chart, i18n message parity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Chart.js options as a Vue computed reading theme.current.value.dark for live restyle"
    - ":key remount on theme name + locale as a fallback when vue-chartjs's shallow options watch misses nested color swaps"
    - "Read t() and locale.value INSIDE chartData computed so labels/dates re-render on language switch"

key-files:
  created: []
  modified:
    - src/components/ForecastChart.vue
    - src/i18n/messages/en.ts
    - src/i18n/messages/ja.ts

key-decisions:
  - "Only chart chrome (ticks/grid/legend) is theme-driven; fixed brand hues #e53935/#1e88e5 stay constant across themes"
  - "dateLocale computed copied verbatim from ForecastList.vue so chart dates localize identically"

patterns-established:
  - "Reactive Chart.js options: convert plain option objects to computeds that read live theme/locale sources"
  - "en/ja parity: new i18n blocks added to both catalogues in the same task"

requirements-completed: [CHRT-03, CHRT-04]

# Metrics
duration: 4min
completed: 2026-07-08
---

# Phase 6 Plan 01: Localized Theme-Aware Forecast Chart Summary

**ForecastChart now restyles its axis/grid/legend on a Vuetify theme flip and re-translates its High/Low dataset labels plus re-formats x-axis dates on an en/ja language switch, with no reload.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-08T13:52:48Z
- **Completed:** 2026-07-08T13:56:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Converted the non-reactive `chartOptions` plain object into a `computed` reading `theme.current.value.dark`, so chart chrome (tick text, grid lines, legend text) recolors live on a theme toggle (CHRT-03 root fix).
- Added a `:key="theme.name.value + '-' + locale"` remount fallback on `<Line>` so nested scale/legend color changes always paint.
- Swapped the two literal dataset labels for `t('chart.tempHigh'/'chart.tempLow', { unit })` and mapped the x-axis dates through `toLocaleDateString(dateLocale.value, ...)`, both read inside `chartData` so they re-render on language switch (CHRT-04).
- Added a new `chart` message block (`tempHigh`, `tempLow`) to both en.ts and ja.ts with the `{unit}` interpolation placeholder (en/ja parity).

## Task Commits

Each task was committed atomically:

1. **Task 1: Make ForecastChart options theme-reactive (CHRT-03)** - `4152145` (feat)
2. **Task 2: i18n dataset labels + locale axis dates (CHRT-04)** - `cd2bbc6` (feat)

## Files Created/Modified
- `src/components/ForecastChart.vue` - `chartOptions` is now a theme-reactive computed; `chartData` uses i18n labels + locale dates; `<Line>` carries a `:key` remount; added `useTheme`/`useI18n`/`dateLocale`.
- `src/i18n/messages/en.ts` - new `chart` block: `tempHigh: 'High {unit}'`, `tempLow: 'Low {unit}'`.
- `src/i18n/messages/ja.ts` - new `chart` block: `tempHigh: '最高 {unit}'`, `tempLow: '最低 {unit}'`.

## Decisions Made
- Only chart chrome is theme-driven; the fixed `#e53935` (high) / `#1e88e5` (low) data hues stay constant across themes because they are brand data colors legible on both surfaces.
- `dateLocale` computed copied verbatim from `ForecastList.vue` (`locale.value === 'ja' ? 'ja-JP' : 'en-GB'`) so the chart x-axis dates localize exactly like the forecast list.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Type-check (`npx vue-tsc --build`), the full production build (`npm run build`, exit 0), and the `cityDetail.spec.ts` regression all pass. (Pre-existing `@vueuse/core` `#__PURE__` annotation warnings from the vendored bundle are out of scope and unchanged by this plan.)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The `chart` message block is intentionally minimal here; plan 06-02 EXTENDS it with `temperature`/`precipitation` keys for the hourly chart. The theme-reactive options + `:key` remount pattern is now the proven template for the hourly chart.
- No blockers.

## Self-Check: PASSED

All modified files and both task commits (4152145, cd2bbc6) verified present on disk / in git history.

---
*Phase: 06-localized-theme-aware-charts*
*Completed: 2026-07-08*
