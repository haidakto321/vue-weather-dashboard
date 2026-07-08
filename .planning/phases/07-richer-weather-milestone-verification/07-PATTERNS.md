# Phase 7: Richer Weather & Milestone Verification - Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 17 (new + modified)
**Analogs found:** 17 / 17

Note: RESEARCH.md already contains verified, codebase-grounded code examples for every file
below (Pattern 1-6, Code Example 1-7). This file adds concrete excerpts/line numbers from the
REAL analog files so the planner can cite exact copy-from locations, and confirms the four
scope resolutions from CONTEXT: GEO-01 uses a static "My Location" label; WTHR-04 adds a new
current-conditions panel to `CityDetailPage.vue`; DATA-06 applies to both `WeatherCard.vue`
and `CityDetailPage.vue`; STATE-04 keyboard-accessible reorder is out of scope.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/composables/useMyLocation.ts` | composable | event-driven | `src/composables/useCurrentWeather.ts` (composable shape) + `src/stores/cities.ts` (`addCity`) | role-match (new capability, no direct analog for geolocation) |
| `src/components/GeolocationButton.vue` | component | request-response | `src/components/CitySearch.vue` (self-contained input component wired to store) | role-match |
| `src/stores/cities.ts` (edit: `reorderCities`) | store | CRUD | itself - `addCity`/`removeCity` in the same file | exact |
| `src/pages/DashboardPage.vue` (edit: draggable grid) | component/page | CRUD | itself - existing `v-row`/`v-col` loop | exact |
| `src/components/WeatherCard.vue` (edit: route-by-key, refresh, wind, testid) | component | request-response | itself - existing card | exact |
| `src/lib/openMeteo.ts` (edit: extended `fetchCurrentWeather`) | service/HTTP | request-response | itself - `fetchForecast`/`fetchHourlyForecast` in same file | exact |
| `src/types/weather.ts` (edit: `CurrentWeather` growth) | model | transform | itself - `DailyForecast`/`HourlyForecast` | exact |
| `src/composables/useWindSpeed.ts` | composable | transform | `src/composables/useTemperature.ts` | exact |
| `src/types/preferences.ts` (edit: `WindUnit` axis) | model | CRUD | itself - `TemperatureUnit`/`ThemeMode`/`Language` axes | exact |
| `src/stores/preferences.ts` (edit: `windUnit` field + sanitize + setter) | store | CRUD | itself - `unit`/`theme`/`language` handling | exact |
| `src/pages/SettingsPage.vue` (edit: wind unit toggle) | component | request-response | itself - unit `v-btn-toggle` block | exact |
| `src/pages/CityDetailPage.vue` (edit: new current-conditions panel) | page | request-response | itself - existing forecast/error/loading branches; `WeatherCard.vue` (current-weather rendering pattern) | role-match |
| `src/i18n/messages/en.ts` / `ja.ts` (edit: new keys) | config/i18n | transform | itself - `card`/`settings`/`chart` blocks | exact |
| `playwright.config.ts` | config | request-response | none in-repo (new tool) - `vite.config.ts`/`vitest.config.ts` for project config conventions | no analog (new infra) |
| `tsconfig.e2e.json` | config | n/a | `tsconfig.node.json` | role-match |
| `e2e/smoke.spec.ts` | test | request-response | `src/__tests__/navigation.spec.ts` (flow-style test), `src/__tests__/cityDetail.spec.ts` (testid assertions) | role-match |
| `src/__tests__/*.spec.ts` (jsdom geolocation shim, updated MSW fixtures) | test | request-response | `src/__tests__/navigation.spec.ts` (ResizeObserver/matchMedia shim pattern), `src/__tests__/cityDetail.spec.ts` (`vi.mock('@/lib/openMeteo')` fixture) | exact |

## Pattern Assignments

### `src/composables/useMyLocation.ts` (composable, event-driven)

**Analog:** `src/composables/useCurrentWeather.ts` (composable export shape) + `src/stores/cities.ts` `addCity` (lines 47-60)

**Composable shape convention** (`src/composables/useCurrentWeather.ts` lines 1-11):
```typescript
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { fetchCurrentWeather } from '@/lib/openMeteo'
import type { SavedCity } from '@/types/weather'

export function useCurrentWeather(city: MaybeRefOrGetter<SavedCity | undefined>) {
  return useQuery({ ... })
}
```
Convention to copy: one exported function per composable file, named `use*`, returns a plain
object of refs/functions (see also `useTemperature.ts` returning `{ unit, unitSymbol, convert, format }`).

**Store write pattern to reuse** (`src/stores/cities.ts` lines 47-60):
```typescript
function addCity(geo: GeoCity) {
  const key = cityKey(geo)
  if (cities.value.some((c) => c.key === key)) return
  cities.value.push({
    key, id: geo.id, name: geo.name,
    latitude: geo.latitude, longitude: geo.longitude,
    country: geo.country, admin1: geo.admin1,
  })
}
```
`useMyLocation.ts` calls this SAME `store.addCity(...)` with `id: 0, name: 'My Location'` (see
RESEARCH Code Example 1, fully verified against installed `@vueuse/core` and `cityKey()`
fallback logic) - no store change needed for GEO-01 dedupe, only for STATE-04's `reorderCities`.

**Full implementation to copy:** RESEARCH.md Code Example 1 (`src/composables/useMyLocation.ts`)
is verified against the installed VueUse source and is ready to use directly, including the
`Number.isFinite(coords.value.latitude)` guard (Pitfall 2) and `pause()` on first fix (Pitfall 1).

---

### `src/components/GeolocationButton.vue` (component, request-response)

**Analog:** `src/pages/SettingsPage.vue` (self-contained control bound to a composable/store,
`data-testid` convention) and `src/components/WeatherCard.vue` (error/loading branch style).

**testid + i18n-driven label convention** (`src/pages/SettingsPage.vue` lines 62-73):
```vue
<v-btn-toggle
  data-testid="unit-toggle"
  :model-value="unit"
  ...
  @update:model-value="onUnitChange"
>
```
Apply the same `data-testid` attribute style to the new button (e.g. `data-testid="geo-button"`)
and drive its label/error text via `t('geo.*')` keys, matching how every other user-facing
string in this project is i18n-keyed (never hard-coded English).

**Error/alert rendering convention** (`src/components/WeatherCard.vue` lines 67-76):
```vue
<v-alert v-else-if="isError" type="error" variant="tonal" density="compact">
  {{ t('card.loadError') }}
  <template #append>
    <v-btn size="small" variant="text" @click.stop.prevent="refetch()">{{ t('card.retry') }}</v-btn>
  </template>
</v-alert>
```
Reuse `v-alert type="error" variant="tonal" density="compact"` for the denied/unavailable/
unsupported states, keyed off `useMyLocation()`'s `errorKind`.

---

### `src/stores/cities.ts` (edit: add `reorderCities`) (store, CRUD)

**Analog:** itself - `addCity`/`removeCity` (lines 47-65)

**Pattern to mirror exactly:**
```typescript
// Remove the city with this key; unknown key is a no-op.
function removeCity(key: string) {
  cities.value = cities.value.filter((c) => c.key !== key)
}
```
New action, same file, same style (whole-array reassignment so `useLocalStorage`'s watcher
persists automatically, `flush: 'sync'` already configured on line 36):
```typescript
function reorderCities(newOrder: SavedCity[]) {
  cities.value = newOrder
}
```
Add `reorderCities` to the returned object on line 67: `return { cities, hasCities, addCity, removeCity, reorderCities }`.

---

### `src/pages/DashboardPage.vue` (edit: draggable grid) (page, CRUD)

**Analog:** itself, current loop (lines 33-37):
```vue
<v-row v-else>
  <v-col v-for="city in cities" :key="city.key" cols="12" sm="6" md="4">
    <WeatherCard :city="city" />
  </v-col>
</v-row>
```
Replace with RESEARCH.md Code Example 2's `<draggable>` wrapper (`tag="div"` + `v-col` inside
`#item` slot, per Pattern 2/Pitfall 4's verified-safe approach - do NOT pass a Vuetify
component as the `tag` prop). Keep `storeToRefs(store)` destructuring of `cities`/`hasCities`
(lines 10-11) unchanged; add `store.reorderCities` as the `@update:model-value` handler
(store itself, not `storeToRefs`, since it is an action call).

---

### `src/components/WeatherCard.vue` (edit: route-by-key, wind, refresh, testid) (component, request-response)

**Analog:** itself (full file read above, lines 1-100)

**Router-link fix required** (line 44):
```vue
:to="{ name: 'city-detail', params: { id: String(city.id) } }"
```
Change to `params: { id: city.key }` (Pitfall 4 - `id: 0` collides across multiple geolocation
saves; `key` is already globally unique). `CityDetailPage.vue` already accepts `c.key === id`
as a fallback (line 25), so no other file needs to change for this fix.

**Destructure pattern to extend** (line 24):
```typescript
const { data, isPending, isError, refetch } = useCurrentWeather(() => props.city)
```
Add `dataUpdatedAt, isRefetching` to the same destructure (RESEARCH Pattern 5/Code Example 5) -
both already returned by `useQuery`, zero new fetch logic.

**Hard-coded unit string to fix** (`en.ts` line 49): `wind: '{value} km/h'` must become
`wind: '{value} {unit}'` (mirrors `chart.tempHigh: 'High {unit}'` at line 53, which is already
parameterized) - see Pitfall 6.

**Content-branch template to extend** (lines 79-97): add the last-updated + refresh row using
the SAME `v-btn size="small" variant="text" @click.stop.prevent="..."` idiom already used for
the error-branch retry button (lines 72-74), plus a `data-testid="weather-card"` on the root
`v-card` (line 43) for TEST-06/Pitfall 8.

---

### `src/lib/openMeteo.ts` (edit: extend `fetchCurrentWeather`) (service, request-response)

**Analog:** itself - `fetchForecast` (lines 84-109) already demonstrates combining
`daily`/`forecast_days`/`timezone: 'auto'` params in one call; `fetchCurrentWeather`
(lines 58-79) is the function being extended.

**Current shape to extend:**
```typescript
interface ForecastResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    weather_code: number
    wind_speed_10m: number
  }
}

export async function fetchCurrentWeather(
  latitude: number, longitude: number, signal?: AbortSignal,
): Promise<CurrentWeather> {
  const response = await http.get<ForecastResponse>(FORECAST_URL, {
    params: {
      latitude, longitude,
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      wind_speed_unit: 'kmh',
    },
    signal,
  })
  const { current } = response.data
  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
  }
}
```
Full extended version (adds `apparent_temperature,precipitation,uv_index` to `current` and a
`daily: 'sunrise,sunset'` block in the SAME request, live-verified against the real API) is in
RESEARCH.md Code Example 3 - copy directly, same shared `http` client (line 7), same
`FORECAST_URL` constant (line 10), same param-object convention (never string-concatenate,
matches `fetchForecast`'s `timezone: 'auto'` usage).

---

### `src/types/weather.ts` (edit: grow `CurrentWeather`) (model, transform)

**Analog:** itself - `DailyForecast`/`HourlyForecast` (lines 39-54) show the field-comment
convention (unit noted per field, e.g. `// hourly precipitation, mm`).

**Current shape** (lines 27-33):
```typescript
export interface CurrentWeather {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
}
```
Add `feelsLike: number`, `precipitation: number`, `uvIndex: number`, `sunrise: string`,
`sunset: string`, each with the same inline unit comment style already used at lines 41-43,
per RESEARCH.md Code Example 3's `types/weather.ts` block.

---

### `src/composables/useWindSpeed.ts` (composable, transform)

**Analog:** `src/composables/useTemperature.ts` (full file, 34 lines) - direct mirror, confirmed
by RESEARCH Pattern 4.

**Exact structure to copy:**
```typescript
import { computed } from 'vue'
import { usePreferencesStore } from '@/stores/preferences'

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32
}

export function useTemperature() {
  const prefs = usePreferencesStore()
  const unit = computed(() => prefs.unit)
  const unitSymbol = computed(() => (unit.value === 'fahrenheit' ? '°F' : '°C'))
  function convert(celsius: number): number {
    return unit.value === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius
  }
  function format(celsius: number): string {
    return `${Math.round(convert(celsius))}${unitSymbol.value}`
  }
  return { unit, unitSymbol, convert, format }
}
```
`useWindSpeed.ts` reads `prefs.windUnit` instead of `prefs.unit`, exports `kmhToMph` instead of
`celsiusToFahrenheit` (RESEARCH Code Example 4 has the complete file) - same shape, same
`{ unit, unitSymbol, convert, format }` return contract so `WeatherCard.vue` can consume it
identically to `useTemperature`.

---

### `src/types/preferences.ts` (edit: `WindUnit` axis) (model, CRUD)

**Analog:** itself - `TemperatureUnit`/`TEMPERATURE_UNITS` (lines 11, 35) and
`DEFAULT_PREFERENCES`/`Preferences` interface (lines 20-31).

**Pattern to mirror exactly:**
```typescript
export type TemperatureUnit = 'celsius' | 'fahrenheit'
export const TEMPERATURE_UNITS = ['celsius', 'fahrenheit'] as const
```
Add:
```typescript
export type WindUnit = 'kmh' | 'mph'
export const WIND_UNITS = ['kmh', 'mph'] as const
```
Extend `Preferences` interface (line 20-24) with `windUnit: WindUnit` and
`DEFAULT_PREFERENCES` (line 27-31) with `windUnit: 'kmh'`.

---

### `src/stores/preferences.ts` (edit: `windUnit` field) (store, CRUD)

**Analog:** itself - `unit` handling throughout (lines 5-10 import, 26-28 sanitize, 54 getter, 59-61 setter)

**Sanitize pattern to mirror** (lines 26-28):
```typescript
unit: (TEMPERATURE_UNITS as readonly string[]).includes(source.unit as string)
  ? (source.unit as TemperatureUnit)
  : DEFAULT_PREFERENCES.unit,
```
Add an identical `windUnit:` branch using `WIND_UNITS`/`WindUnit`. Add `import { ..., WIND_UNITS } from '@/types/preferences'` and `WindUnit` to the type import (line 11). Add
getter `const windUnit = computed(() => prefs.value.windUnit)` (mirrors line 54) and setter
`function setWindUnit(w: WindUnit) { prefs.value.windUnit = w }` (mirrors lines 59-61). Add
both to the returned object (line 69).

---

### `src/pages/SettingsPage.vue` (edit: wind unit toggle) (component, request-response)

**Analog:** itself - the unit `v-btn-toggle` block (lines 20-23, 58-75)

**Pattern to mirror exactly:**
```vue
const unitOptions = computed<{ value: TemperatureUnit; label: string }[]>(() => [
  { value: 'celsius', label: t('settings.celsius') },
  { value: 'fahrenheit', label: t('settings.fahrenheit') },
])
function onUnitChange(value: unknown) {
  if (value === 'celsius' || value === 'fahrenheit') {
    store.setUnit(value)
  }
}
```
```vue
<v-card class="mb-4">
  <v-card-title>{{ t('settings.unitSection') }}</v-card-title>
  <v-card-text>
    <v-btn-toggle data-testid="unit-toggle" :model-value="unit" color="primary" mandatory
      density="comfortable" @update:model-value="onUnitChange">
      <v-btn v-for="opt in unitOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</v-btn>
    </v-btn-toggle>
  </v-card-text>
</v-card>
```
Copy this whole block for wind unit: `windUnitOptions`, `onWindUnitChange`, new `v-card` with
`data-testid="wind-unit-toggle"`, sourced from `storeToRefs(store)` adding `windUnit` (line 12).

---

### `src/pages/CityDetailPage.vue` (edit: new current-conditions panel) (page, request-response)

**Analog:** itself for structure (loading/error/content branches, lines 66-94) and
`WeatherCard.vue` for how current-weather data is fetched/rendered (lines 24, 79-96).

**New composable call to add**, mirroring the existing `useForecast(city)`/`useHourlyForecast(city)` calls (lines 37, 45):
```typescript
const { data, isPending, isError, refetch } = useForecast(city)
const { data: hourly } = useHourlyForecast(city)
```
Add: `const { data: current, isPending: currentPending, isError: currentError, refetch: refetchCurrent, dataUpdatedAt, isRefetching } = useCurrentWeather(city)` - SAME composable
`WeatherCard.vue` already uses (`src/composables/useCurrentWeather.ts`), reactive to the
resolved `city` computed already on this page (lines 23-26), no new fetch infrastructure.

**Panel placement:** insert a new `v-row`/`v-col` block above the existing forecast `v-row`
(line 80), using the same `v-progress-circular`/`v-alert type="error"`/content-branch
`v-else-if` pattern already established on lines 66-94, and reuse `wmoToCondition` +
`useTemperature`/`useWindSpeed` formatting exactly as `WeatherCard.vue` does (lines 26-29, 81-96).
This satisfies WTHR-04's "cards/detail" wording (CityDetailPage currently has zero
current-conditions display) and DATA-06's confirmed scope extension to this page.

---

### `src/i18n/messages/en.ts` / `ja.ts` (edit: new keys) (config/i18n, transform)

**Analog:** itself - `card` block (lines 44-51), `settings` block (line 104+), `chart` block
(lines 52-57, shows the `{unit}`-parameterized message convention needed for Pitfall 6).

**Keys to add** (en.ts, mirror into ja.ts for parity - `i18nParity.spec.ts` already enforces
key-set equality between locales):
- `geo.myLocation`, `geo.useMyLocation`, `geo.denied`, `geo.unavailable`, `geo.unsupported`
- `card.wind: '{value} {unit}'` (replaces line 49's hard-coded `'{value} km/h'`)
- `card.feelsLike`, `card.precipitation`, `card.uvIndex`, `card.sunrise`, `card.sunset`, `card.lastUpdated: 'Updated {time}'`, `card.refresh`
- `settings.windUnitSection`, `settings.kmh`, `settings.mph`

---

### `playwright.config.ts` / `tsconfig.e2e.json` / `e2e/smoke.spec.ts` (new infra, TEST-06)

**No direct in-repo analog** for `playwright.config.ts` (first e2e tool in the project) - use
RESEARCH.md Code Example 6 verbatim (verified against `playwright.dev` docs, matches the
project's existing Vite dev port 5173 with no override in `vite.config.ts`).

**`tsconfig.e2e.json` analog:** `tsconfig.node.json`'s shape (not read in full this session,
but RESEARCH Pitfall 9 confirms its `include` pattern to mirror: point `include` at
`["playwright.config.ts", "e2e/**/*.ts"]`, do NOT add it to the root `tsconfig.json`
`references` array).

**`e2e/smoke.spec.ts` analog:** `src/__tests__/navigation.spec.ts` (flow-style assertions) and
`src/__tests__/cityDetail.spec.ts` (testid lookups, lines 121-130):
```typescript
const list = wrapper.find('[data-testid="forecast-list"]')
const chart = wrapper.find('[data-testid="forecast-chart"]')
const hourlyChart = wrapper.find('[data-testid="hourly-chart"]')
```
The e2e test reuses these SAME three testids (already on `ForecastList.vue` line 49,
`ForecastChart.vue` line 104, `HourlyChart.vue` line 115 - no changes needed there) plus two
new ones added in this phase (`city-search` on `CitySearch.vue`'s `v-autocomplete`,
`weather-card` on `WeatherCard.vue`'s root `v-card`). Full spec in RESEARCH.md Code Example 7.

---

### `src/__tests__/*.spec.ts` (geolocation shim, updated MSW fixtures) (test, request-response)

**jsdom shim analog** (`src/__tests__/navigation.spec.ts` lines 18-27, same pattern repeated in
`citySearch.spec.ts` lines 35-44 and `settingsPage.spec.ts` lines 20-29):
```typescript
// ResizeObserver is not implemented in jsdom but Vuetify components reference it.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // Vuetify reads matchMedia for display breakpoints.
  globalThis.matchMedia =
    globalThis.matchMedia ||
    (() => ({ matches: false, addListener: () => {}, removeListener: () => {} }))
})
```
For GEO-01 component tests, add a sibling shim in the same `beforeAll` style:
```typescript
globalThis.navigator.geolocation = {
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
  getCurrentPosition: vi.fn(),
} as unknown as Geolocation
```
(per RESEARCH Environment Availability table - jsdom has no Geolocation API at all).

**MSW/mock fixture update needed** (`src/__tests__/cityDetail.spec.ts`'s `vi.mock('@/lib/openMeteo')`
fixture and `src/__tests__/openMeteo.spec.ts`'s MSW handler) - both currently return the OLD
`CurrentWeather` shape (no `feelsLike`/`precipitation`/`uvIndex`/`sunrise`/`sunset`); per
Pitfall 5, update both to the extended shape so new UI code does not read `undefined`.

## Shared Patterns

### i18n key parity (en/ja)
**Source:** `src/__tests__/i18nParity.spec.ts` (enforces identical key sets across locales)
**Apply to:** every new `geo.*`, `card.*`, `settings.*` key - add to BOTH `en.ts` and `ja.ts`
in the same commit/plan, never one file alone.

### `data-testid` convention
**Source:** `src/components/ForecastList.vue:49`, `ForecastChart.vue:104`, `HourlyChart.vue:115`,
`src/pages/SettingsPage.vue:63,84,99`
**Apply to:** `WeatherCard.vue` (`weather-card`), `CitySearch.vue` (`city-search`),
`GeolocationButton.vue` (`geo-button`), new `SettingsPage.vue` wind-unit toggle
(`wind-unit-toggle`) - kebab-case, descriptive, always on the outermost interactive/content element.

### Pinia setup-store + `useLocalStorage` persistence
**Source:** `src/stores/cities.ts` (lines 33-68), `src/stores/preferences.ts` (lines 38-70)
**Apply to:** `reorderCities` action and `windUnit` field - both slot into EXISTING stores;
no new store file needed. `flush: 'sync'` is already configured on both persisted refs, so no
extra persistence code is needed for either addition.

### Composable mirror pattern (`use*` returning a plain refs/functions object)
**Source:** `src/composables/useTemperature.ts` (34 lines, full file)
**Apply to:** `useWindSpeed.ts` (exact structural mirror) and `useMyLocation.ts` (same
`export function use*() { ...; return {...} }` shape, different internals).

### Error/loading/content three-branch template
**Source:** `src/components/WeatherCard.vue` lines 61-97, `src/pages/CityDetailPage.vue` lines 66-94
**Apply to:** `GeolocationButton.vue`'s denied/unavailable/unsupported states and
`CityDetailPage.vue`'s new current-conditions panel - `v-skeleton-loader`/`v-progress-circular`
for loading, `v-alert type="error" variant="tonal" density="compact"` for error, `v-else-if`
content branch.

### Axios param-object HTTP calls (never string-concatenate)
**Source:** `src/lib/openMeteo.ts` (all four existing functions, e.g. lines 90-101)
**Apply to:** the extended `fetchCurrentWeather` - all new query params (`apparent_temperature`,
`precipitation`, `uv_index`, `daily: 'sunrise,sunset'`) go through the same `params: {...}`
object passed to `http.get`, same shared `http` client (line 7) and `FORECAST_URL` (line 10).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `playwright.config.ts` | config | request-response | First e2e/browser-automation tool in the project; no in-repo precedent. Use RESEARCH.md Code Example 6 (verified against official docs) as the source of truth instead. |
| `src/composables/useMyLocation.ts` | composable | event-driven | No existing composable wraps a browser permission/watch API; nearest structural analog (composable export shape) noted above, but the geolocation-specific logic (Pitfall 1/2 guards) has no in-repo precedent - use RESEARCH.md Code Example 1 directly. |

## Metadata

**Analog search scope:** `src/` (composables, components, pages, stores, types, lib, i18n,
`__tests__`) - full project source tree; no `node_modules` or build output searched.
**Files scanned:** 25+ (all files listed by the initial `Glob src/**/*.{ts,vue}`, plus targeted
reads of the 12 files most relevant to the six phase requirements).
**Pattern extraction date:** 2026-07-09
