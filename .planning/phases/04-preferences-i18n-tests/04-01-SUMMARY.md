---
phase: 04-preferences-i18n-tests
plan: 01
subsystem: preferences-persistence
tags: [pinia, vueuse, localstorage, composable, vitest, settings]
requires:
  - Pinia (registered in main.ts)
  - SavedCity / DailyForecast / CurrentWeather types (Phase 2/3)
provides:
  - usePreferencesStore (unit/theme/language, persisted, sanitized)
  - persisted useCitiesStore (VueUse useLocalStorage, validated)
  - useTemperature composable (celsiusToFahrenheit, convert, format, unitSymbol)
  - preferences types + option arrays (single source of allowed values)
  - Settings temperature-unit control
affects:
  - 04-02 (theme slice consumes store.theme + Settings Theme placeholder)
  - 04-03 (i18n slice consumes store.language + Settings Language placeholder)
tech-stack:
  added: ["@vueuse/core", "vue-i18n@9"]
  patterns:
    - "setup-style Pinia store owning a VueUse useLocalStorage ref"
    - "read-back sanitize/validate of tamper-controllable localStorage"
    - "convert-at-display-edge: stored temps stay °C, composable converts for display"
key-files:
  created:
    - src/types/preferences.ts
    - src/stores/preferences.ts
    - src/composables/useTemperature.ts
    - src/__tests__/preferences.store.spec.ts
    - src/__tests__/useTemperature.spec.ts
  modified:
    - package.json
    - src/stores/cities.ts
    - src/components/WeatherCard.vue
    - src/components/ForecastList.vue
    - src/components/ForecastChart.vue
    - src/pages/SettingsPage.vue
    - src/__tests__/cities.store.spec.ts
    - implementation-notes.md
decisions:
  - "vue-i18n pinned to v9 (the Vue 3 line) per plan, despite npm deprecation notice"
  - "flush: 'sync' on both useLocalStorage refs so a change persists immediately"
  - "cities + preferences rewritten as setup stores to own the VueUse ref cleanly"
metrics:
  duration: "~9 min"
  completed: "2026-06-14"
  tasks: 3
  files: 13
---

# Phase 4 Plan 01: Preferences backbone + unit slice Summary

A persisted preferences Pinia store (unit/theme/language) and a persisted cities store, both
backed by VueUse `useLocalStorage` with read-back validation, plus a `useTemperature`
composable that drives a live temperature-unit toggle through the weather card, forecast
list, and chart.

## What was built

- **`src/types/preferences.ts`** - `TemperatureUnit` / `ThemeMode` / `Language` string-literal
  unions, `Preferences` interface, `DEFAULT_PREFERENCES`, and the `TEMPERATURE_UNITS` /
  `THEME_MODES` / `LANGUAGES` option arrays used by both the UI and the validators.
- **`src/stores/preferences.ts`** - `usePreferencesStore` setup store persisted via
  `useLocalStorage('weather-prefs', ...)` with `mergeDefaults: true`, a `sanitize` helper that
  resets any out-of-range field to its default on read-back (threat T-04-01), reactive
  `unit`/`theme`/`language` getters, and `setUnit`/`setTheme`/`setLanguage` actions.
- **`src/stores/cities.ts`** - now a setup store persisted via `useLocalStorage('weather-cities',
  [])`; public surface (`cities`, `hasCities`, `addCity`, `removeCity`, dedupe) unchanged;
  read-back drops malformed entries (threat T-04-02).
- **`src/composables/useTemperature.ts`** - pure `celsiusToFahrenheit` plus `useTemperature()`
  returning `{ unit, unitSymbol, convert, format }`, all reactive to the store unit.
- **Components** - `WeatherCard`, `ForecastList`, `ForecastChart` render temperatures through
  the composable; the chart converts dataset values and uses `unitSymbol` in labels. Wind,
  humidity, and Chart.js registration/options unchanged.
- **`src/pages/SettingsPage.vue`** - a `v-btn-toggle` Celsius/Fahrenheit control bound to
  `setUnit`, plus placeholder Theme and Language sections for 04-02/04-03.
- **Tests** - `preferences.store.spec.ts` (defaults, three setters, persistence to
  `weather-prefs`, invalid read-back fallback) and `useTemperature.spec.ts` (pure conversion,
  celsius/fahrenheit format, reactivity).

## Verification results

- `npm run lint` - pass (no output, exit 0).
- `npx vue-tsc --noEmit -p tsconfig.app.json` - pass (exit 0, strict mode).
- `npm test` (full suite) - **6 files / 20 tests passed**: preferences-store (6),
  useTemperature (4), cities-store (4), cityDetail, navigation, sample. No regressions.
- Greps confirm: `useLocalStorage` in both stores; `usePreferencesStore` in the composable;
  `useTemperature` in all three components; no hardcoded `°C` literal on a temperature value;
  no `v-html` in any touched file.

The only runtime notice is jsdom's "HTMLCanvasElement getContext() not implemented" for the
Chart.js component test - pre-existing and benign; the test still passes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sync localStorage flush for immediate persistence**
- **Found during:** Task 3 (preferences store test)
- **Issue:** VueUse `useLocalStorage` defaults to an async ('pre') watcher flush, so a setter's
  change was not yet in `localStorage` when the test read it back. It also meant a very fast
  reload could lose a just-made change.
- **Fix:** added `flush: 'sync'` to the `useLocalStorage` options in both `preferences.ts` and
  `cities.ts`, so writes persist at once.
- **Files modified:** src/stores/preferences.ts, src/stores/cities.ts
- **Commit:** 3c3224b

**2. [Rule 3 - Blocking] Test isolation for the now-persisted cities store**
- **Found during:** Task 1 (existing cities.store.spec.ts)
- **Issue:** once the cities list persists to localStorage, a fresh Pinia no longer resets it,
  so saved cities leaked between tests and the "unknown key is a no-op" test saw 2 entries.
- **Fix:** added `localStorage.clear()` in the spec's `beforeEach` (before `setActivePinia`).
  The store's behavior/public surface is unchanged; only test isolation was added. This is the
  same pattern the plan prescribes for the new preferences/composable specs.
- **Files modified:** src/__tests__/cities.store.spec.ts
- **Commit:** 9158263

### Note (not a code deviation)

- npm prints a deprecation notice that `vue-i18n@9` (and v10) are no longer maintained and
  suggests v11. The plan explicitly pins v9 (the agreed Vue 3 stack), so v9 was installed as
  written. Migrating to v11 can be revisited when 04-03 actually wires i18n.

## Commits

- `9158263` feat(04-01): add persisted preferences store and persist cities store
- `d3f8d04` feat(04-01): add useTemperature composable and wire live unit display
- `3c3224b` feat(04-01): wire Settings unit control and add preferences store test

## Known Stubs

The Theme and Language sections in `SettingsPage.vue` render intentional placeholder text and
wire no behavior. This is by design: the `theme`/`language` state already lives in the store
(so later plans add only a control + consumer), and the placeholders are scheduled for 04-02
(theme) and 04-03 (language). Not a blocker for this plan's goal (the unit slice).

## Self-Check: PASSED

- Files created exist: src/types/preferences.ts, src/stores/preferences.ts,
  src/composables/useTemperature.ts, src/__tests__/preferences.store.spec.ts,
  src/__tests__/useTemperature.spec.ts - all FOUND.
- Commits exist: 9158263, d3f8d04, 3c3224b - all FOUND in git log.
