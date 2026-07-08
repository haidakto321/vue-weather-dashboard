---
phase: 05-refactor-hardening
plan: 01
subsystem: data
tags: [vue, tanstack-vue-query, MaybeRefOrGetter, toValue, enabled-guard, i18n, vuetify]

# Dependency graph
requires:
  - phase: 02-data (v1.0)
    provides: openMeteo.ts HTTP layer, SavedCity type, original composables
  - phase: 03-detail (v1.0)
    provides: CityDetailPage with route-param city lookup
provides:
  - useForecast(city, MaybeRefOrGetter<SavedCity | undefined>) with computed queryKey and enabled guard
  - useCurrentWeather with the same reactive signature and guard
  - CityDetailPage wired to the city computed directly (Proxy workaround deleted)
  - Retry buttons on both error states (detail alert + weather card) via Vue Query refetch
  - i18n keys card.retry / detail.retry in en+ja; dead card notFound key removed
affects: [05-02 router hardening, 05-03 citysearch/i18n, phase 6 geolocation, phase 6 hourly chart, phase 7 refresh]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reactive composable input: MaybeRefOrGetter<T | undefined> + toValue() + computed queryKey + enabled guard"
    - "Guard-throw in queryFn instead of non-null assertion (teaches why enabled exists)"
    - "Retry affordance: v-alert #append slot with v-btn calling Vue Query refetch()"
    - "Getter prop wiring: useCurrentWeather(() => props.city) keeps prop reactivity"

key-files:
  created: []
  modified:
    - src/composables/useForecast.ts
    - src/composables/useCurrentWeather.ts
    - src/pages/CityDetailPage.vue
    - src/components/WeatherCard.vue
    - src/i18n/messages/en.ts
    - src/i18n/messages/ja.ts

key-decisions:
  - "ja retry copy is short imperative (matching existing ja imperative style)"
  - "Guard-throw with a descriptive message in queryFn rather than a non-null assertion, per RESEARCH Pitfall 1"

patterns-established:
  - "Reactive query composable: MaybeRefOrGetter param, computed key, enabled gate - all later v1.1 query features build on this"
  - "Retry button in v-alert #append; card variant uses @click.stop.prevent so the router-link card does not navigate"

requirements-completed: [DATA-04, DATA-05, WTHR-03]

# Metrics
duration: 5min
completed: 2026-07-08
---

# Phase 5 Plan 01: Reactive Composables + Retry Summary

**Reactive useForecast/useCurrentWeather with enabled guards kill the CityDetailPage Proxy hack and null-island fetch; retry buttons added to both error states and the dead 404 card branch removed**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-08T00:33:37Z
- **Completed:** 2026-07-08T00:38:30Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Both composables now accept `MaybeRefOrGetter<SavedCity | undefined>`, use a `computed` queryKey (`['forecast', key]` / `['currentWeather', key]`, roots and staleTime unchanged), and gate fetching with `enabled: computed(() => !!toValue(city))` - no request can fire before a city resolves (DATA-04, T-05-03).
- CityDetailPage passes its existing `city` computed straight into `useForecast(city)`; the Proxy workaround, the lat-0/lon-0 sentinel ref, and its watch are deleted. The route param remains a store-lookup key only, never coordinates (T-05-01).
- Retry buttons wired to Vue Query `refetch()` in both error alerts; the card variant uses `@click.stop.prevent` so retry never triggers the card's router-link navigation (DATA-05).
- WeatherCard's dead axios-404 "city not found" branch and its axios import removed; error state renders generic `card.loadError` copy only, never the raw error object (WTHR-03, T-05-02).
- i18n key parity preserved: `card.retry` + `detail.retry` added to BOTH en.ts and ja.ts; dead card `notFound` key deleted from BOTH.
- `cityDetail.spec.ts` (and the full 24-test suite) passed with zero test edits after every task - DATA-04 preserved behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rework useForecast and useCurrentWeather to reactive city signature** - `401711b` (refactor)
2. **Task 2: Delete CityDetailPage Proxy hack, pass city computed, add detail retry** - `3c32d5b` (refactor)
3. **Task 3: WeatherCard getter prop, remove dead 404 branch, add card retry** - `f062a05` (refactor)

## Files Created/Modified

- `src/composables/useForecast.ts` - reactive param, computed key, enabled guard, guard-throw queryFn
- `src/composables/useCurrentWeather.ts` - same pattern with the currentWeather key root
- `src/pages/CityDetailPage.vue` - Proxy workaround deleted; `useForecast(city)`; detail retry button
- `src/components/WeatherCard.vue` - getter prop `() => props.city`; dead 404 branch removed; card retry with `.stop.prevent`
- `src/i18n/messages/en.ts` - added `card.retry`, `detail.retry`; removed card `notFound`
- `src/i18n/messages/ja.ts` - same key changes (parity maintained)

## Decisions Made

- ja retry copy: "再試行" for both `card.retry` and `detail.retry` - short imperative matching the existing ja copy style.
- queryFn uses a guard-throw with a descriptive message instead of a `!` assertion (RESEARCH Pitfall 1) - safer and teaches why `enabled` exists.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The reactive composable pattern (MaybeRefOrGetter + enabled) is now the foundation every later v1.1 query feature (hourly chart, geolocation, manual refresh) builds on - the STATE.md Proxy-hack blocker is resolved.
- Plan 05-02 (router lazy-loading + 404) and 05-03 (CitySearch debounce, i18n v11) are unblocked and independent of this change.
- Human verification of the network-tab behavior (no latitude=0/longitude=0 request on deep link; retry after offline toggle) is deferred to end-of-phase per workflow.human_verify_mode.

## Self-Check: PASSED

All 6 modified files plus SUMMARY.md exist on disk; task commits 401711b, 3c32d5b, f062a05 verified in git log.
