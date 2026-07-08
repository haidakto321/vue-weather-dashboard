# Phase 6: Localized, Theme-Aware Charts - Pattern Map

**Mapped:** 2026-07-08
**Files analyzed:** 12 (2 new, 9 edited, 1 test group)
**Analogs found:** 12 / 12 (every new/changed file has a strong in-repo analog)

All analogs are inside this repo - Phase 6 adds no new machinery, it wires the existing reactive sources (Vuetify theme, vue-i18n locale, unit, city) into `computed`s. Copy from the files below rather than from RESEARCH code blocks where they differ; the real files carry the teaching-comment voice the project requires.

## File Classification

| New/Modified File | Role | Reactivity concern | Closest Analog | Match |
|-------------------|------|--------------------|----------------|-------|
| `src/components/ForecastChart.vue` (edit) | component (chart) | recompute on **theme + locale + unit** | itself + `ForecastList.vue` (date pattern) | exact |
| `src/components/HourlyChart.vue` (NEW) | component (chart) | recompute on **theme + locale + unit** | `ForecastChart.vue` | exact |
| `src/composables/useHourlyForecast.ts` (NEW) | composable (server state) | recompute on **city** | `useForecast.ts` | exact |
| `src/lib/openMeteo.ts` (edit) | api-layer (HTTP) | none (pure fetch) | `fetchForecast` in same file | exact |
| `src/types/weather.ts` (edit) | type | none | `DailyForecast` interface | exact |
| `src/pages/CityDetailPage.vue` (edit) | page | recompute on **city** | its own `useForecast(city)` wiring | exact |
| `src/components/CitySearch.vue` (edit) | component (form) | re-validate on **locale** | itself (current static schema) | exact |
| `src/lib/wmo.ts` (edit) | util (data map) | none | itself (current `Condition`) | exact |
| `src/components/WeatherCard.vue` (edit) | component | render on **locale** | `condition.label` render site | exact |
| `src/components/ForecastList.vue` (edit) | component | render on **locale** | `day.condition.label` render site | exact |
| `src/i18n/messages/en.ts` (edit) | i18n | n/a (source of truth) | existing key blocks | exact |
| `src/i18n/messages/ja.ts` (edit) | i18n | n/a (parity) | `en.ts` shape | exact |
| `src/__tests__/*` (edit/new) | test | n/a | `openMeteo.spec.ts`, `citySearch.spec.ts` | role-match |

## Shared Reactivity Discipline (applies to both chart files)

The whole phase turns on one rule seen in `ForecastList.vue` and `useTemperature.ts`: **read the reactive source (`theme.current.value`, `t()`, `locale.value`, `convert()`) INSIDE a `computed`** so a change re-runs it. The current `ForecastChart.chartOptions` breaks this rule (plain object) - that is the CHRT-03 bug.

**Theme source** - `useThemePreference.ts` proves the app drives Vuetify's theme through `useTheme()` and switches live (`vuetifyTheme.change(next)` on a store watch). Charts must READ that same instance:
```typescript
// src/composables/useThemePreference.ts:26 - how the app gets the theme instance
const vuetifyTheme = useTheme()
// ...
vuetifyTheme.change(theme.value)   // app WRITES; charts only READ theme.current.value
```

**Locale source** - `useLanguagePreference.ts:23-36` proves locale switches live via a store watch into `locale.value`, so any `computed` that reads `locale.value`/`t()` re-runs on switch.

**Unit source** - `useTemperature.ts:19-33` is the one place unit lives; `convert()`/`unitSymbol` are already reactive. Both charts call `const { convert, unitSymbol } = useTemperature()`.

## Pattern Assignments

### `src/components/ForecastChart.vue` (component - theme + locale + unit) [EDIT]

**Analog:** itself (current state) + `ForecastList.vue` for the locale-date pattern.

**Current registration + imports** (`ForecastChart.vue:1-20`) - keep as is:
```typescript
import { computed } from 'vue'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js'
import { Line } from 'vue-chartjs'
import { useTemperature } from '@/composables/useTemperature'
import type { DailyForecast } from '@/types/weather'
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)
```

**The bug to fix** (`ForecastChart.vue:53-56`) - plain object, cannot restyle on theme flip:
```typescript
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
}
```
Replace with a `computed` reading `useTheme().current.value.dark` (feed `ticks.color`/`grid.color`/`legend.labels.color`). Add `useTheme` + `useI18n` imports. See RESEARCH Code Example 1.

**Labels are already a `computed`** (`ForecastChart.vue:32-50`) - so CHRT-04 only swaps the literals. Current:
```typescript
label: `High ${unitSymbol.value}`,   // -> t('chart.tempHigh', { unit: unitSymbol.value })
label: `Low ${unitSymbol.value}`,    // -> t('chart.tempLow',  { unit: unitSymbol.value })
labels: props.forecast.dates,        // -> map through toLocaleDateString(dateLocale.value, ...)
```
Keep the fixed data hues `#e53935` / `#1e88e5` (anti-pattern: do NOT theme-drive data colors, only chrome).

**Copy the date-locale pattern verbatim from `ForecastList.vue:15-28`:**
```typescript
const { locale } = useI18n()
const dateLocale = computed(() => (locale.value === 'ja' ? 'ja-JP' : 'en-GB'))
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(dateLocale.value, {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}
```

**Template** (`ForecastChart.vue:59-64`) - add `:key` remount (Pitfall 1):
```vue
<Line :key="theme.name.value + '-' + locale" :data="chartData" :options="chartOptions" />
```

---

### `src/components/HourlyChart.vue` (component - theme + locale + unit) [NEW]

**Analog:** `ForecastChart.vue` (entire file - copy its shape). Differences: base `Chart` component instead of `Line`, TWO controllers registered, two y-axes, `hourly` prop.

**Registration differs** - base `Chart` does NOT auto-register (Pitfall 4). Register both controllers:
```typescript
import { Chart } from 'vue-chartjs'   // base component, needs a type prop
ChartJS.register(
  BarController, BarElement, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend,
)
```

**Everything else mirrors ForecastChart:** same `useTheme` + `useI18n` + `useTemperature` wiring, same `computed chartData`/`chartOptions`, same `:key` remount, same fixed hues. Precipitation dataset gets `yAxisID: 'y1'` and is NOT unit-converted (mm only, Pitfall 8). Time labels use `toLocaleTimeString(timeLocale.value, { hour: '2-digit' })` - the time twin of ForecastList's `dateLocale`. Full source in RESEARCH Code Example 5.

---

### `src/composables/useHourlyForecast.ts` (composable - city reactive) [NEW]

**Analog:** `src/composables/useForecast.ts` (copy the entire file, change 3 things).

**Copy this exact skeleton** (`useForecast.ts:11-31`), changing `queryKey` prefix to `'hourly'`, `queryFn` to call `fetchHourlyForecast`, and drop the `days` arg:
```typescript
export function useForecast(city: MaybeRefOrGetter<SavedCity | undefined>) {
  return useQuery({
    queryKey: computed(() => ['forecast', toValue(city)?.key]),   // -> ['hourly', ...]
    queryFn: ({ signal }) => {
      const c = toValue(city)
      if (!c) throw new Error('useForecast: query must stay disabled without a city')
      return fetchForecast(c.latitude, c.longitude, 7, signal)     // -> fetchHourlyForecast(c.latitude, c.longitude, signal)
    },
    enabled: computed(() => !!toValue(city)),                       // keep verbatim - the enabled guard
    staleTime: 5 * 60 * 1000,
  })
}
```
The `enabled` guard + `MaybeRefOrGetter` + `toValue` are the DATA-04 pattern - do not deviate. CityDetailPage passes its existing `city` computed straight in.

---

### `src/lib/openMeteo.ts` (api-layer - add `fetchHourlyForecast`) [EDIT]

**Analog:** `fetchForecast` in the same file (`openMeteo.ts:75-100`). Copy it, change the params + response shape.

**Copy this structure** (note: local response interface so no `any`, params via axios `params` for URL-encoding, `signal` passthrough):
```typescript
interface DailyForecastResponse {                    // -> HourlyForecastResponse { hourly: {...} }
  daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[] }
}
export async function fetchForecast(latitude, longitude, days = 7, signal?: AbortSignal): Promise<DailyForecast> {
  const response = await http.get<DailyForecastResponse>(FORECAST_URL, {
    params: {
      latitude, longitude,
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',   // -> hourly: 'temperature_2m,precipitation'
      forecast_days: days,                                            // -> forecast_days: 1  (24 pts, Pitfall 5)
      timezone: 'auto',
    },
    signal,
  })
  const { daily } = response.data
  return { dates: daily.time, tempMax: ..., tempMin: ..., weatherCodes: ... }
}
```
Reuse the existing `http` client and `FORECAST_URL` const (`openMeteo.ts:7,10`) - do NOT create a new axios instance. Full new-function source in RESEARCH Code Example 3.

---

### `src/types/weather.ts` (type) [EDIT]

**Analog:** `DailyForecast` (parallel-array convention). Add `HourlyForecast { times: string[]; temperature: number[]; precipitation: number[] }`. Same shape family as the `DailyForecast` returned at `openMeteo.ts:94-99`.

---

### `src/pages/CityDetailPage.vue` (page - city reactive) [EDIT]

**Analog:** its own existing `useForecast(city)` wiring (`CityDetailPage.vue:35`).

Add alongside the existing forecast query:
```typescript
// existing (line 35) - the exact pattern to duplicate:
const { data, isPending, isError, refetch } = useForecast(city)
// add: const { data: hourly } = useHourlyForecast(city)   // same `city` computed, no re-plumbing
```
Mount `<HourlyChart v-if="hourly" :hourly="hourly" />` inside the `v-else-if="forecast"` content block (`CityDetailPage.vue:71-82`), under the temperature `<ForecastChart>` column. Add a `t('detail.hourlyHeading')` heading following the existing `t('detail.temperatureHeading')` convention (`:78`).

---

### `src/components/CitySearch.vue` (form - re-validate on locale) [EDIT]

**Analog:** itself (current static schema).

**Current static schema** (`CitySearch.vue:20-31`) - the 3 English literals to move to `t()`:
```typescript
const schema = yup
  .string()
  .required('Enter a city name')        // -> t('validation.cityRequired')
  .min(2, 'Type at least 2 characters') // -> t('validation.cityMin')
  .max(80, 'City name is too long')     // -> t('validation.cityMax')

const { value: term, errorMessage, validate, resetField } = useField<string>('city', schema, {
  validateOnValueUpdate: false,   // KEEP - prevents the stale "required" bug (comment at :26-28)
})
```
Wrap the schema in `computed(() => yup.string()...)` referencing `t()` (rules is `MaybeRef`, accepted). `t` is already imported (`:17`). Keep `validateOnValueUpdate: false`. If a visible error lags on locale switch, add `watch(locale, () => { if (errorMessage.value) validate() })` (Pitfall 6). Note: the current file comment at `:15-16` says validation copy is "out of scope" - Phase 6 removes that caveat.

---

### `src/lib/wmo.ts` (util - data map) [EDIT]

**Analog:** itself. Change the `Condition` interface + table values only; the export signature `wmoToCondition(code): Condition` stays.

**Current** (`wmo.ts:5-8, 10-11, 41-45`):
```typescript
interface Condition { label: string; icon: string }        // -> { labelKey: string; icon: string }
const WMO_TABLE: Record<number, Condition> = {
  0: { label: 'Clear sky', icon: 'mdi-weather-sunny' },     // -> { labelKey: 'wmo.0', icon: 'mdi-weather-sunny' }
  // ... 28 codes total
}
const FALLBACK: Condition = { label: 'Unknown', icon: 'mdi-weather-cloudy-alert' }  // -> labelKey: 'wmo.unknown'
export function wmoToCondition(code: number): Condition { return WMO_TABLE[code] ?? FALLBACK }
```
Keep the icon map (data stays in the util). Move the 28 English label strings + `Unknown` into the `wmo.*` message block as the en values (they become the parity source). Code set (verified `wmo.ts:11-38`): `0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99` + `unknown`.

---

### `src/components/WeatherCard.vue` + `src/components/ForecastList.vue` (render on locale) [EDIT]

**Render sites to change from `.label` to `t(.labelKey)`:**
- `WeatherCard.vue:84` - `<div class="text-body-2">{{ condition.label }}</div>` -> `{{ t(condition.labelKey) }}` (`t` already imported at `:15`, `condition` computed at `:27-29`).
- `ForecastList.vue:51` - `<v-list-item-subtitle>{{ day.condition.label }}</v-list-item-subtitle>` -> `{{ t(day.condition.labelKey) }}` (`t` NOT yet destructured here - `ForecastList.vue:15` only pulls `locale`; add `t` to that `useI18n()` call).

---

### `src/i18n/messages/en.ts` + `ja.ts` (i18n) [EDIT]

**Analog:** existing grouped key blocks (`en.ts:18-70`). Add three new sibling blocks following the same nesting style:
```typescript
chart:      { tempHigh: 'High {unit}', tempLow: 'Low {unit}', temperature: 'Temperature {unit}', precipitation: 'Precipitation' },
validation: { cityRequired: 'Enter a city name', cityMin: 'Type at least 2 characters', cityMax: 'City name is too long' },
wmo:        { '0': 'Clear sky', /* ...28 codes... */ '99': 'Thunderstorm with heavy hail', unknown: 'Unknown' },
```
Also add `detail.hourlyHeading` next to `temperatureHeading` (`en.ts:47`). **Parity rule** (documented in the `en.ts:2-6` header comment): every key added to `en.ts` MUST land in `ja.ts` in the SAME task - `wmo` alone is 29 keys. The current header comment at `en.ts:14-17` says WMO labels are intentionally English-only; Phase 6 reverses that - update the comment. `fallbackLocale: 'en'` masks a missing ja key at runtime (Pitfall 7), so eyeball parity or add a key-count test.

## Shared Patterns

### Locale-aware date/time formatting
**Source:** `src/components/ForecastList.vue:15-28`
**Apply to:** ForecastChart (dates), HourlyChart (times)
```typescript
const { locale } = useI18n()
const dateLocale = computed(() => (locale.value === 'ja' ? 'ja-JP' : 'en-GB'))
new Date(iso).toLocaleDateString(dateLocale.value, { weekday: 'short', day: 'numeric', month: 'short' })
```

### Reactive server-state composable (enabled guard)
**Source:** `src/composables/useForecast.ts:11-31`
**Apply to:** useHourlyForecast
Computed `queryKey` on `toValue(city)?.key` + `enabled: computed(() => !!toValue(city))` + re-check-and-throw in `queryFn` (never `!`). This is the DATA-04 pattern - do not snapshot the prop.

### Theme instance access
**Source:** `src/composables/useThemePreference.ts:26` (`const vuetifyTheme = useTheme()`)
**Apply to:** both chart components (READ `theme.current.value.dark` inside a computed; also `theme.name.value` for the `:key`). Always use `.value` (Pitfall 2).

### Unit conversion
**Source:** `src/composables/useTemperature.ts:14-34`
**Apply to:** both charts - `const { convert, unitSymbol } = useTemperature()`; temperature data mapped through `convert`, labels through `unitSymbol.value`. Precipitation is exempt (mm, no toggle).

### axios params (no string concat)
**Source:** `src/lib/openMeteo.ts:81-92` (`fetchForecast`)
**Apply to:** fetchHourlyForecast - pass all query values via the `params` object, thread `signal` (V5 input-validation control).

## No Analog Found

None. Every new/changed file has a direct in-repo analog. The two NEW files (`HourlyChart.vue`, `useHourlyForecast.ts`) are near-copies of `ForecastChart.vue` and `useForecast.ts` respectively.

## Test Analogs

| New/changed test | Analog | Note |
|------------------|--------|------|
| hourly API-layer test (`fetchHourlyForecast`) | `src/__tests__/openMeteo.spec.ts` | MSW-mocked success/empty/error - same harness as `fetchForecast` (TEST-04) |
| WMO label i18n / chart label assertions | `src/__tests__/citySearch.spec.ts` | any test asserting old English WMO labels or `High °C` literals must update to the new `t()` keys |
| optional message key-parity test | (new) | `Object.keys(en.wmo).length === Object.keys(ja.wmo).length` - cheap Pitfall-7 guard, planner's call |

## Metadata

**Analog search scope:** `src/components/`, `src/composables/`, `src/lib/`, `src/pages/`, `src/i18n/messages/`, `src/__tests__/`
**Files read this session:** 12 source files + 2 planning docs
**Pattern extraction date:** 2026-07-08

## PATTERN MAPPING COMPLETE
