---
phase: 07-richer-weather-milestone-verification
reviewed: 2026-07-09T00:00:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - e2e/smoke.spec.ts
  - src/__tests__/cities.store.spec.ts
  - src/__tests__/cityDetail.spec.ts
  - src/__tests__/dashboardPage.spec.ts
  - src/__tests__/openMeteo.spec.ts
  - src/__tests__/preferences.store.spec.ts
  - src/__tests__/settingsPage.spec.ts
  - src/__tests__/useMyLocation.spec.ts
  - src/__tests__/useWindSpeed.spec.ts
  - src/__tests__/weatherCard.spec.ts
  - src/components/CitySearch.vue
  - src/components/GeolocationButton.vue
  - src/components/WeatherCard.vue
  - src/composables/useMyLocation.ts
  - src/composables/useWindSpeed.ts
  - src/i18n/messages/en.ts
  - src/i18n/messages/ja.ts
  - src/lib/openMeteo.ts
  - src/pages/CityDetailPage.vue
  - src/pages/DashboardPage.vue
  - src/pages/SettingsPage.vue
  - src/stores/cities.ts
  - src/stores/preferences.ts
  - src/types/preferences.ts
  - src/types/weather.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-07-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Reviewed the Phase 07 "richer weather" milestone files: geolocation (`useMyLocation`,
`GeolocationButton`), wind-unit support (`useWindSpeed`, preferences store/types), the
extended `WeatherCard`/`CityDetailPage` (feels-like, precipitation, UV, sunrise/sunset,
last-updated, refresh), the `openMeteo.ts` HTTP layer, i18n catalogues, and the
corresponding vitest/MSW/Playwright tests.

No security vulnerabilities, hardcoded secrets, injection risks, or crash-causing bugs
were found. `openMeteo.ts` correctly uses axios `params` (no string concatenation) for
all user-controllable input, and the `CityDetailPage`/`WeatherCard` route params are only
ever used to look up an already-saved city, never to build a request. The preferences and
cities stores both sanitize/validate localStorage read-back against allow-lists. Quick-scan
patterns (secrets, `eval`, `innerHTML`, empty catches, `console.log`/TODO markers, `any`
casts, `==`/`!=`) all came back clean across the reviewed files.

The issues found below are logic edge cases, a silently-swallowed error state, an a11y/HTML
validity gap widened by this phase's new refresh button, and a handful of dead-code/
documentation-drift items. None are blocking, but WR-01 and WR-02 are worth fixing before
this ships since they affect correctness of what the user sees.

## Warnings

### WR-01: Route-id lookup can resolve to the wrong "My Location" city

**File:** `src/pages/CityDetailPage.vue:27-30`
**Issue:** The city lookup is `store.cities.find((c) => String(c.id) === id || c.key === id)`.
Every geolocation-added city has `id: 0` (see `src/composables/useMyLocation.ts:37`), so if
the route param is the literal string `"0"` (e.g. a user types/bookmarks `/city/0`, or any
future code path passes the raw `id` instead of the composite `key`), the first `String(c.id)
=== id` branch matches the **first** saved "My Location" entry in the array — not necessarily
the one the user meant — instead of falling through to a not-found state. `weatherCard.spec.ts`
proves the app can hold multiple `id: 0` cities with distinct `key`s (`geoHome`/`geoWork`), so
this collision is reachable in normal usage, just not through the app's own generated links
(which always route by `city.key`).
**Fix:** Drop the `String(c.id) === id` branch (it is already redundant for real geocoded
cities, since `cityKey()` sets `key = String(id)` when `id` is truthy) and match on `key` only:
```ts
const city = computed<SavedCity | undefined>(() => {
  const id = String(route.params.id)
  return store.cities.find((c) => c.key === id)
})
```

### WR-02: Hourly forecast fetch failures are silently swallowed

**File:** `src/pages/CityDetailPage.vue:55, 211`
**Issue:** `const { data: hourly } = useHourlyForecast(city)` only destructures `data`. Unlike
the daily forecast (`isError`/`refetch`, lines 47/125-131) and current weather (`currentError`/
`refetchCurrent`, lines 62-67/140-153), a failed hourly query has no error branch — `hourly`
just stays `undefined` forever, `<HourlyChart v-if="hourly">` never renders, and the user sees
no indication that the hourly section failed to load (no spinner while pending either, so a
slow/failed request just looks like a permanently missing section).
**Fix:** Destructure and surface the hourly query's pending/error state the same way the other
two queries do:
```ts
const { data: hourly, isPending: hourlyPending, isError: hourlyError, refetch: refetchHourly } =
  useHourlyForecast(city)
```
and add a loading/error branch around the `<HourlyChart>` block mirroring the current-conditions
pattern above it.

### WR-03: Unguarded index access on `daily.sunrise[0]` / `daily.sunset[0]`

**File:** `src/lib/openMeteo.ts:95-96`
**Issue:** `fetchCurrentWeather` reads `daily.sunrise[0]` / `daily.sunset[0]` without checking
the arrays are non-empty. The request always asks for `forecast_days: 1`, so this holds under
normal Open-Meteo behavior, but there is no defensive check — if the API ever returns an empty
`daily.sunrise`/`daily.sunset` array (e.g. a coordinate at extreme latitude during polar
day/night, which Open-Meteo is documented to sometimes omit sunrise/sunset for), `sunrise`/
`sunset` become `undefined`, and `WeatherCard.vue`/`CityDetailPage.vue`'s `formatTime()` calls
`new Date(undefined)`, rendering the string "Invalid Date" in the UI instead of failing loudly
or hiding the field.
**Fix:** Guard the index access and fall back to `null`/omit the field, and have the callers
skip rendering sunrise/sunset when absent:
```ts
sunrise: daily.sunrise[0] ?? null,
sunset: daily.sunset[0] ?? null,
```
(with the `CurrentWeather` type and render sites updated to treat `null` as "not shown").

### WR-04: Buttons nested inside the card's anchor wrapper (invalid HTML / a11y)

**File:** `src/components/WeatherCard.vue:87-93, 107-111, 147-154`
**Issue:** `<v-card :to="{ name: 'city-detail', ... }">` (line 79-83) renders as an `<a>` element
(Vuetify's router-link integration). This phase adds a new refresh `<v-btn>` (147-154) alongside
the pre-existing remove (87-93) and retry (107-111) buttons, all nested **inside** that anchor.
Interactive elements (`<button>`) nested inside another interactive element (`<a>`) is invalid
HTML5 and produces inconsistent behavior across assistive technologies (nested-interactive
elements are not reliably exposed to screen readers, even though `.stop`/`.stop.prevent`
correctly prevents the click from also triggering navigation for mouse/keyboard users).
**Fix:** Move the `:to` navigation off the outer `<v-card>` and onto an explicit overlay/link
element that sits behind the action buttons (e.g. Vuetify's `<v-card>` with a `<router-link
class="v-card__overlay-link" ...>` first child, or restructure so the card title text itself is
the link and the action buttons are siblings, not descendants, of the anchor).

## Info

### IN-01: Stale comment in GeolocationButton.vue

**File:** `src/components/GeolocationButton.vue:6-7`
**Issue:** The comment reads "Not wired into any page yet - Plan 07-06 imports this into
DashboardPage.vue." `DashboardPage.vue:24` already renders `<GeolocationButton class="mb-4" />`
in this same phase, so the comment is now inaccurate and will mislead future readers into
thinking the component is dead/unused.
**Fix:** Update or remove the comment now that the component is wired in, e.g. "Wired into
DashboardPage.vue; kept self-contained (no props/emits) so it can be reused elsewhere."

### IN-02: Unused i18n key `card.wind`

**File:** `src/i18n/messages/en.ts:57`, `src/i18n/messages/ja.ts:42`
**Issue:** Both catalogues define `card.wind: '{value} {unit}'`, but neither `WeatherCard.vue`
nor `CityDetailPage.vue` calls `t('card.wind', ...)` — wind speed is rendered directly via
`useWindSpeed().format()` (`WeatherCard.vue:127`, `CityDetailPage.vue:183`). This is dead
translation content that must still be kept in sync between `en.ts`/`ja.ts` for no functional
benefit.
**Fix:** Remove the unused `card.wind` key from both catalogues (or wire it in if it was meant
to replace `useWindSpeed().format()`'s inline string building).

### IN-03: `isValidSavedCity` does not validate `country`/`admin1`

**File:** `src/stores/cities.ts:21-31`
**Issue:** `SavedCity.country` is typed as a required `string` (`src/types/weather.ts:23`), but
`isValidSavedCity()` only checks `key`, `id`, `latitude`, `longitude`, and `name`. A tampered
`weather-cities` localStorage entry with a missing/non-string `country` (or a non-string
`admin1`) would pass validation and be trusted as a well-formed `SavedCity`, propagating a
`country: undefined` (or wrong type) value into `subtitle`/`cityTitle` computed properties
elsewhere.
**Fix:** Extend the guard to also check `typeof o.country === 'string'` and, if present,
`typeof o.admin1 === 'string'`.

### IN-04: `reorderCities` accepts unvalidated input

**File:** `src/stores/cities.ts:69-71`
**Issue:** `reorderCities(newOrder: SavedCity[])` assigns `cities.value = newOrder` directly
with no shape validation, unlike the one-time `isValidSavedCity` filter applied at store
creation (line 42). In the current app this is only ever called with `vuedraggable`'s
reordered subset of the existing array, so it's low risk today, but the store's public API
contract is weaker than `addCity`'s (which builds a validated object field-by-field) and would
silently persist malformed entries if a future caller passed anything else.
**Fix:** Re-run `newOrder.filter(isValidSavedCity)` (or at least assert `newOrder.length ===
cities.value.length`) before assigning, so the store's persistence guarantee holds for every
mutation path, not just the initial hydration.

### IN-05: `GeolocationPositionError` code 3 (TIMEOUT) path is untested

**File:** `src/composables/useMyLocation.ts:48`
**Issue:** `errorKind.value = error.value.code === 1 ? 'denied' : 'unavailable'` intentionally
folds both `POSITION_UNAVAILABLE` (2) and `TIMEOUT` (3) into `'unavailable'`, but
`useMyLocation.spec.ts` only exercises codes 1 and 2 (lines 60-96). The timeout branch is
plausible in real usage (slow GPS fix) and currently has no regression coverage.
**Fix:** Add a third error-path test in `useMyLocation.spec.ts` asserting `error({ code: 3, ...
})` also yields `errorKind.value === 'unavailable'`.

---

_Reviewed: 2026-07-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
