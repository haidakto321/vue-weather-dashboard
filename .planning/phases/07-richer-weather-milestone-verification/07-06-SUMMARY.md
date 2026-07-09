---
phase: 07-richer-weather-milestone-verification
plan: 06
subsystem: ui
tags: [vue, pinia, vuedraggable, useLocalStorage, geolocation, vitest]

# Dependency graph
requires:
  - phase: 07-01
    provides: vuedraggable@^4.1.0 installed and pinned to the Vue-3-compatible major
  - phase: 07-04
    provides: GeolocationButton.vue + useMyLocation composable (self-contained, no props)
provides:
  - "cities store reorderCities(newOrder) action, persisted the same way as addCity/removeCity"
  - "DashboardPage.vue draggable card grid (STATE-04) wired to store.reorderCities"
  - "DashboardPage.vue GeolocationButton entry point (GEO-01) above the city grid"
affects: [08-e2e-verification, any future dashboard-layout work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vuedraggable wrapper uses tag=\"div\" plus a v-col inside the #item slot - never a Vuetify component object passed as the tag prop"
    - "Store actions that reassign a useLocalStorage ref wholesale persist for free (mirrors addCity/removeCity's existing style)"

key-files:
  created:
    - src/__tests__/dashboardPage.spec.ts
  modified:
    - src/stores/cities.ts
    - src/pages/DashboardPage.vue
    - src/__tests__/cities.store.spec.ts

key-decisions:
  - "reorderCities is a one-line whole-array reassignment (cities.value = newOrder), matching addCity's push / removeCity's filter style so useLocalStorage's watcher persists it identically"
  - "Store tests must await nextTick() between mutating calls: useLocalStorage self-dispatches a same-window 'storage' event on every write, which pauses/resumes its own internal watcher across a Vue nextTick - back-to-back synchronous mutations in the same tick can silently skip persisting without the await (a real library timing quirk, not an app bug)"

patterns-established:
  - "Pattern: whole-array store-action reassignment for useLocalStorage persistence (reorderCities alongside addCity/removeCity)"

requirements-completed: [GEO-01, STATE-04]

# Metrics
duration: 3min
completed: 2026-07-09
---

# Phase 07 Plan 06: Draggable Reorder + Geolocation Entry Point Summary

**Drag-and-drop city reorder via vuedraggable wired into DashboardPage, persisted through a new reorderCities store action, plus the already-built GeolocationButton wired in above the city grid.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-09T19:58:XX+07:00
- **Completed:** 2026-07-09T20:01:48+07:00
- **Tasks:** 2 completed
- **Files modified:** 4 (1 new test file, 3 modified)

## Accomplishments
- `useCitiesStore` gained `reorderCities(newOrder)`, persisting drag-and-drop order to `localStorage` exactly like `addCity`/`removeCity` already do (STATE-04 persistence requirement).
- `DashboardPage.vue`'s city grid is now a `<draggable>` wrapper (`tag="div"` + `v-col` inside `#item`) bound to the store via `item-key="key"` and `@update:model-value="store.reorderCities"`.
- `GeolocationButton` (built in Plan 07-04) is now visibly wired into the dashboard between `CitySearch` and the city grid (GEO-01 entry point is live).
- New `dashboardPage.spec.ts` proves both the seeded render order and reactive re-render after a store-level reorder.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add reorderCities store action** - `ae04df7` (feat)
2. **Task 2: Wire draggable grid + GeolocationButton into DashboardPage** - `8e36d11` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/stores/cities.ts` - added `reorderCities(newOrder: SavedCity[])`, exported from the store's returned object
- `src/__tests__/cities.store.spec.ts` - added "reorderCities replaces the city order and persists it" test
- `src/pages/DashboardPage.vue` - imported `draggable` (vuedraggable) and `GeolocationButton`; replaced the `v-row`/`v-col` loop with a `<draggable>` wrapper; added `<GeolocationButton class="mb-4" />` after `CitySearch`
- `src/__tests__/dashboardPage.spec.ts` (new) - two tests: seeded render order, and reactive re-render on `store.reorderCities`

## Decisions Made
- `reorderCities` mirrors the file's existing whole-array-reassignment style (`cities.value = newOrder`) rather than an in-place splice/sort, since that is the exact pattern that makes `useLocalStorage`'s watcher persist automatically (documented in the interfaces section of the plan).
- Store tests await `nextTick()` between consecutive mutating calls. This was required to work around a genuine `@vueuse/core` `useLocalStorage` timing quirk (see Deviations) rather than a defect in `reorderCities` itself.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/test-timing] Store test needed `await nextTick()` between mutations to observe persistence correctly**
- **Found during:** Task 1 (writing the reorderCities persistence test)
- **Issue:** `useLocalStorage` (from `@vueuse/core`) dispatches a real `storage` DOM event on every write (for cross-tab sync). In jsdom, that event is delivered synchronously back to the *same* window's own listener, which briefly calls `pauseWatch()` synchronously and then schedules `resumeWatch()` via Vue's `nextTick()` (a microtask). If a test calls two mutating store actions back-to-back in the same synchronous tick (e.g. `addCity(london); addCity(tokyo)` with no `await` between them), the second mutation's write is silently dropped because the watcher is still paused from the first write's self-triggered event. This is a real behavior of the installed library version, not a bug in `reorderCities` (`cities.value = newOrder` is correct and matches `addCity`/`removeCity`'s exact pattern) - it is a test-synchronization concern only.
- **Fix:** Added `await nextTick()` (from `vue`) after each store mutation in the new "reorderCities replaces the city order and persists it" test, so the watcher is re-armed before the next mutation fires. Verified via a scratch repro (isolated `useStorage`/`watchPausable` test) that confirmed the pause/resume-via-storage-event root cause before applying the fix.
- **Files modified:** `src/__tests__/cities.store.spec.ts`
- **Verification:** `npx vitest run src/__tests__/cities.store.spec.ts` - all 5 tests pass, including the new reorderCities test asserting both in-memory order and `localStorage.getItem('weather-cities')` content.
- **Committed in:** `ae04df7` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (test-timing correction, Rule 1)
**Impact on plan:** No production-code impact - `reorderCities` itself is exactly as specified in the plan. The fix only ensures the new test observes real persistence behavior correctly; existing `addCity`/`removeCity` tests were unaffected because they never asserted on `localStorage` content after multiple rapid mutations, so this timing quirk was previously latent and untested.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- STATE-04 (drag-and-drop reorder, persists across reload) and GEO-01 (dashboard "Use my location" entry point) are both fully wired and automated-test-covered.
- Deferred per plan's `<verification>` section: a manual end-of-phase human check remains - dragging two cards to confirm the visual order survives a real page reload, and clicking "Use my location" to confirm a card appears (this triggers a real browser permission prompt, which is out of scope for automated tests).
- No blockers for the next plan in Phase 07.

---
*Phase: 07-richer-weather-milestone-verification*
*Completed: 2026-07-09*
