---
phase: 05-refactor-hardening
plan: 04
subsystem: testing
tags: [msw, vitest, vue-test-utils, fake-timers, axios, vueuse, debounce, abortsignal]

# Dependency graph
requires:
  - phase: 05-02
    provides: CitySearch refactor to useDebounceFn + AbortController cleanup (SRCH-04) - the behavior these tests pin
  - phase: 05-03
    provides: msw devDependency installed and its threat gate (msw confined to src/__tests__)
provides:
  - MSW node-environment tests for the openMeteo.ts HTTP boundary (success, empty, error shapes)
  - CitySearch component tests covering debounce, abort-on-new-input, and select-clears-field
  - Regression lock for the Phase 5 API layer and search rework
affects: [phase-06, phase-07, testing, openMeteo, CitySearch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-file `// @vitest-environment node` docblock to run HTTP-layer specs in Node (axios http adapter = MSW's most reliable interception path)"
    - "MSW v2 setupServer with onUnhandledRequest: 'error' so any live request fails loudly"
    - "Fake timers + advanceTimersByTimeAsync + flushPromises for debounce/abort tests (no real sleeps)"
    - "Drive Vuetify components via findComponent VAutocomplete $emit('update:search') instead of DOM typing through the overlay"

key-files:
  created:
    - src/__tests__/openMeteo.spec.ts
    - src/__tests__/citySearch.spec.ts
  modified: []

key-decisions:
  - "openMeteo spec runs in the node environment and imports the real openMeteo functions (no vi.mock) so MSW exercises actual URL/param/error serialization"
  - "CitySearch spec keeps vi.mock('@/lib/openMeteo') (module mock, not MSW) to match the existing suite and keep component tests fast/deterministic"
  - "No src/__tests__/msw/handlers.ts created - per-test server.use() overrides sufficed (no real reuse emerged), per plan default"

patterns-established:
  - "API-layer tests use MSW node interception; component tests stub the HTTP module - two distinct, documented strategies"
  - "AbortSignal capture via vi.mocked(fn).mock.calls[0][1] to assert abort-on-new-input"

requirements-completed: [TEST-04, TEST-05]

# Metrics
duration: 4min
completed: 2026-07-08
---

# Phase 5 Plan 04: API-layer and Search Tests Summary

**MSW node tests exercise the real openMeteo.ts HTTP boundary (success/empty/error) and jsdom fake-timer tests pin CitySearch debounce, abort-on-new-input, and select-clears-field - the whole 34-test suite is green.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-08T12:46:39Z
- **Completed:** 2026-07-08T12:50:20Z
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments
- `openMeteo.spec.ts`: 7 node-environment MSW tests covering geocode param encoding + normalization, empty-result `[]`, current-weather/forecast snake_case -> camelCase normalization, HTTP 500 rejection exposing `response.status`, and network-error rejection - zero live network calls.
- `citySearch.spec.ts`: 3 jsdom component tests proving the debounce collapses two quick keystrokes into one geocode call with the latest term, the first request's AbortSignal is aborted by a newer term, and selecting a city saves it to the store and resets the field.
- Full suite green in one `npm run test` run (34 tests, 9 files); production build clean (exit 0) with no msw chunk in `dist/`.

## Task Commits

Each task was committed atomically:

1. **Task 1: MSW node-environment tests for openMeteo.ts (TEST-04)** - `72264a0` (test)
2. **Task 2: CitySearch component tests - debounce, abort, select (TEST-05)** - `0e4a488` (test)

**Plan metadata:** committed separately with STATE.md and ROADMAP.md (docs commit).

## Files Created/Modified
- `src/__tests__/openMeteo.spec.ts` - Node-env MSW spec exercising the real openMeteo HTTP boundary (URL/param/error serialization + normalization).
- `src/__tests__/citySearch.spec.ts` - jsdom component spec for CitySearch debounce/abort/select using fake timers and a module mock of the HTTP layer.

## Decisions Made
- Kept two distinct test strategies as the plan directed: MSW for the API layer (real axios boundary is the learning target), module mock for the component (fast, deterministic, matches existing suite).
- Did not create `src/__tests__/msw/handlers.ts`; per-test `server.use()` overrides were enough, so no shared handler module was introduced.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. All tests passed on first run. The build emits pre-existing `INVALID_ANNOTATION` warnings from `@vueuse/core` `/* #__PURE__ */` comment positions inside `node_modules`; these are out of scope (not caused by this plan) and the build still exits 0.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The Phase 5 API layer and search rework are now regression-locked by tests. Phases 6-7 can build on openMeteo.ts and CitySearch with a safety net.
- No blockers. msw containment gate holds (no msw import outside `src/__tests__`; no `public/mockServiceWorker.js`).

## Self-Check: PASSED
- FOUND: src/__tests__/openMeteo.spec.ts
- FOUND: src/__tests__/citySearch.spec.ts
- FOUND commit: 72264a0 (Task 1)
- FOUND commit: 0e4a488 (Task 2)

---
*Phase: 05-refactor-hardening*
*Completed: 2026-07-08*
