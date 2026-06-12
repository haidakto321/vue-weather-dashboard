---
phase: 02-first-weather-slice
plan: 01
type: summary
status: complete
requirements:
  - STATE-01
  - STATE-03
  - SRCH-03
  - DATA-01
  - DATA-02
---

# Plan 02-01 Summary: Data backbone

## What was built

The data/server-state backbone for the first weather slice. Each library got one
obvious job:

- **pinia** - client state: in-memory saved-cities store.
- **axios** - HTTP layer: Open-Meteo geocoding + current-weather client.
- **@tanstack/vue-query** - server state: per-city weather caching/loading/error.
- **vee-validate + yup** - installed now (used by plan 02-02), so 02-02 needs no install.

## Artifacts

| File | Provides |
|------|----------|
| `src/main.ts` (mod) | Registers `createPinia()` + `VueQueryPlugin` before mount |
| `src/types/weather.ts` | `GeoCity`, `SavedCity`, `CurrentWeather` interfaces |
| `src/lib/openMeteo.ts` | `geocodeCity(name, signal?)`, `fetchCurrentWeather(lat, lon, signal?)`, shared axios `http` client |
| `src/lib/wmo.ts` | `wmoToCondition(code) -> { label, icon }` lookup + fallback |
| `src/stores/cities.ts` | `useCitiesStore` - `cities`, `hasCities`, `addCity`, `removeCity`, `cityKey` dedupe |
| `src/composables/useCurrentWeather.ts` | `useCurrentWeather(city)` Vue Query wrapper keyed by `city.key` |
| `src/__tests__/cities.store.spec.ts` | Store unit test (add / dedupe / remove / remove-unknown) |
| `package.json` (mod) | Adds pinia, axios, @tanstack/vue-query, vee-validate, yup |

## Verification

- `npm run lint` - pass
- `npx vue-tsc --noEmit -p tsconfig.app.json` - no type errors (strict)
- `npm test -- src/__tests__/cities.store.spec.ts` - 4/4 pass

## Contracts for plan 02-02

- `geocodeCity(name, signal?): Promise<GeoCity[]>` - `[]` means not-found.
- `fetchCurrentWeather(lat, lon, signal?): Promise<CurrentWeather>`.
- `useCurrentWeather(city: SavedCity)` - returns Vue Query result (`data`, `isPending`, `isError`, `error`, `refetch`).
- `useCitiesStore()` - `cities`, `hasCities`, `addCity(geo)`, `removeCity(key)`.
- `wmoToCondition(code): { label, icon }`.

## Deviations

- Dropped a planned reactive `useCurrentWeatherRef` variant: 02-02's `WeatherCard`
  consumes a plain `SavedCity` prop, so the ref variant was unused complexity.
  See `implementation-notes.md`.

## Commits

None - this run executed inline at the user's request ("No commits, inline").
Working tree holds all changes; user commits manually.
