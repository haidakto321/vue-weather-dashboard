---
phase: 03-detail-charts
plan: 01
type: summary
status: awaiting-human-verify
requirements:
  - NAV-02
  - WTHR-02
  - CHRT-01
  - CHRT-02
tech-stack:
  added:
    - chart.js@4.5.1
    - vue-chartjs@5.3.3
  patterns:
    - "DailyForecast as four parallel arrays (dates/tempMax/tempMin/weatherCodes) feeding both list and chart"
    - "Vue Query keyed by city.key so a city change re-keys, refetches, and re-renders (CHRT-02)"
    - "Chart.js tree-shaken: register Line/Point/scales/Tooltip/Legend once at module load"
key-files:
  created:
    - src/composables/useForecast.ts
    - src/components/ForecastChart.vue
    - src/components/ForecastList.vue
    - src/__tests__/cityDetail.spec.ts
  modified:
    - src/types/weather.ts
    - src/lib/openMeteo.ts
    - src/pages/CityDetailPage.vue
    - src/components/WeatherCard.vue
    - src/layouts/AppShell.vue
    - package.json
    - implementation-notes.md
decisions:
  - "Parallel-array DailyForecast maps to list + chart with zero reshaping and mirrors the Open-Meteo daily response"
  - "useForecast keyed by city.key is the CHRT-02 reactivity mechanism (no manual chart.update)"
  - "CityDetailPage passes useForecast a Proxy<SavedCity> over a queryCity ref to keep the Vue Query key live as :id changes"
  - "AppShell City Detail link points at id:'detail' (a non-saved id -> friendly not-found) instead of the dead hardcoded id:'tokyo'"
metrics:
  tasks-completed: 3
  tasks-total: 4
  completed-date: 2026-06-12
---

# Phase 3 Plan 01: Detail & Charts Summary

The full Detail and Charts vertical slice - clicking a dashboard city opens `/city/:id`, the detail page reads the route param, resolves the saved city, fetches a 7-day Open-Meteo forecast via axios + Vue Query, and renders both a per-day forecast list and a reactive Chart.js temperature chart. Tasks 1-3 are done and all gates pass; Task 4 is the blocking human-verify checkpoint (not self-approved).

## What was built

End to end: click a `WeatherCard` -> `/city/:id` -> `CityDetailPage` resolves the `SavedCity` from the param -> `useForecast(city)` (Vue Query, keyed by `city.key`) -> `fetchForecast` (axios, shared `http` client) -> `ForecastList` + `ForecastChart`, with loading / error / not-found states.

## Artifacts

| File | Provides |
|------|----------|
| `src/types/weather.ts` (mod) | Adds `DailyForecast` (`dates`, `tempMax`, `tempMin`, `weatherCodes` - equal-length parallel arrays) |
| `src/lib/openMeteo.ts` (mod) | Adds `fetchForecast(lat, lon, days=7, signal?)` reusing the shared `http` client + `FORECAST_URL`; `daily=temperature_2m_max,temperature_2m_min,weather_code`, `timezone=auto`; local `DailyForecastResponse` interface (no `any`) |
| `src/composables/useForecast.ts` | `useForecast(city)` - `useQuery` keyed `['forecast', city.key]`, `staleTime` 5 min, forwards Vue Query signal |
| `src/components/ForecastChart.vue` | vue-chartjs `Line` of daily high/low; Chart.js pieces registered once; `computed` `chartData` over the prop -> reacts to city change; container `data-testid="forecast-chart"` |
| `src/components/ForecastList.vue` | One row per day - date, `wmoToCondition` icon+label, rounded high/low; container `data-testid="forecast-list"` |
| `src/pages/CityDetailPage.vue` (replaced) | Reads `route.params.id`, resolves the `SavedCity` reactively, calls `useForecast`, renders loading / error / not-found / content |
| `src/components/WeatherCard.vue` (mod) | Card `:to` `{ name: 'city-detail', params: { id: String(city.id) } }`; remove button uses `@click.stop` so removing does not navigate |
| `src/layouts/AppShell.vue` (mod) | City Detail drawer link no longer hardcodes `id: 'tokyo'`; uses `id: 'detail'` -> friendly not-found |
| `src/__tests__/cityDetail.spec.ts` | Mocks `@/lib/openMeteo`, seeds London (2643743), navigates to `city-detail`, asserts city name + forecast-list + forecast-chart markers |
| `package.json` (mod) | Adds `chart.js@^4.5.1` + `vue-chartjs@^5.3.3` (only) |
| `implementation-notes.md` (mod) | Phase 3 decisions + deviations |

## Requirements satisfied

- **NAV-02**: dashboard cards link to `/city/:id`; the detail page reads the param and loads that city.
- **WTHR-02**: multi-day forecast list (date, condition, high/low) via `fetchForecast` + `ForecastList`.
- **CHRT-01**: Chart.js + vue-chartjs temperature chart renders on the detail page.
- **CHRT-02**: chart re-renders per city - `useForecast` is keyed by `city.key`, so a different city is a different query key and fresh data.

## Verification

| Gate | Result |
|------|--------|
| `npx vitest run src/__tests__/cityDetail.spec.ts` | PASS - 1 file, 1 test (GREEN) |
| `npm run lint` | PASS - exit 0, no warnings |
| `npx vue-tsc --noEmit -p tsconfig.app.json` | PASS - no type errors (strict mode) |
| `npm test` (full suite) | PASS - 4 files, 10 tests (sample, navigation x4, cities store x4, cityDetail x1); no regressions |
| `v-html` grep in new components | None (XSS gate clear) |

Note: under jsdom Chart.js logs a benign "HTMLCanvasElement.getContext() not implemented" warning when `<Line>` mounts; the spec asserts the chart CONTAINER exists (not pixels), so it passes - the plan explicitly allows this. No `canvas` package was added.

## TDD Gate Compliance

- RED: Task 1 created `cityDetail.spec.ts` and ran it failing (placeholder page, no `London`) - the documented expected outcome.
- GREEN: Task 3 built the real page/components and turned the same spec green without weakening any assertion.
- No commits were made (user's "No commits, inline" mode), so the RED/GREEN gates are evidenced by the two recorded test runs in this summary and implementation-notes, not by `test(...)`/`feat(...)` commits.

## Deviations from Plan

### Auto-fixed / plumbing

**1. [Rule 3 - Blocking] cityDetail.spec shared Pinia instance**
- Found during: Task 3 (first GREEN run rendered "city not found").
- Issue: the spec seeded the store via `setActivePinia(createPinia())` but `mount` installed a separate `createPinia()` plugin, so the component read an empty Pinia and the param did not resolve.
- Fix: create one Pinia per test, set it active for seeding AND pass that same instance into `global.plugins`. Same category as Phase 2's navigation-spec Pinia plumbing - test wiring only; assertions unchanged.
- Files: `src/__tests__/cityDetail.spec.ts`.

**2. [Rule 2 - Correctness] Reactive Vue Query key via Proxy in CityDetailPage**
- The resolved city is a `computed` that changes with `:id`; passing its plain value would freeze the query key at mount. Kept a `queryCity` ref (updated by a `watch`) and passed `useForecast` a `Proxy<SavedCity>` whose getters read `queryCity.value`, keeping the key live so navigating between cities refetches (CHRT-02).
- Files: `src/pages/CityDetailPage.vue`.

**3. [Planned variation] AppShell City Detail link**
- Replaced the dead `id: 'tokyo'` with `id: 'detail'` (a non-saved id rendering the friendly not-found state), keeping the labeled item so `navigation.spec.ts` stays green. This is the plan's own instruction for Task 3.5.
- Files: `src/layouts/AppShell.vue`.

navigation.spec.ts did NOT need editing this phase (its `/city/tokyo` push and three-item expectations still hold).

## Known Stubs

None - the forecast list and chart are wired to live `useForecast` data; mock data exists only inside the test.

## Checkpoint reached

Task 4 is `type="checkpoint:human-verify" gate="blocking"`. Tasks 1-3 are complete and all automated gates pass. STOPPED at the checkpoint WITHOUT self-approving - the human must verify in the browser (`npm run dev`): click-through navigation, per-city forecast list, chart that updates when switching cities, loading/error/not-found states, and that the remove button still works without navigating.

## Git

No `git add` / `git commit` performed (user's "No commits, inline" mode). All changes plus this SUMMARY sit uncommitted in the working tree. STATE.md / ROADMAP.md untouched (orchestrator owns those).

## Self-Check: PASSED

- Created files exist: `src/composables/useForecast.ts`, `src/components/ForecastChart.vue`, `src/components/ForecastList.vue`, `src/__tests__/cityDetail.spec.ts` - all present.
- Modified files updated: `src/types/weather.ts`, `src/lib/openMeteo.ts`, `src/pages/CityDetailPage.vue`, `src/components/WeatherCard.vue`, `src/layouts/AppShell.vue`, `package.json`, `implementation-notes.md`.
- No commit hashes to verify (no-commit mode by design).
