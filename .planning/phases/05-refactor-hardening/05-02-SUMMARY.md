---
phase: 05-refactor-hardening
plan: 02
subsystem: navigation + search
tags: [router, code-splitting, 404, debounce, vueuse, i18n]
requires:
  - "05-01: locale files carry card.retry / detail.retry; card.notFound deleted"
provides:
  - "Lazy-loaded page routes (one Vite chunk per page) - NAV-04"
  - "Catch-all 404 route + NotFoundPage.vue - NAV-05"
  - "CitySearch debounce via useDebounceFn with onScopeDispose cleanup - SRCH-04"
affects:
  - src/router/index.ts
  - src/pages/NotFoundPage.vue
  - src/components/CitySearch.vue
  - src/i18n/messages/en.ts
  - src/i18n/messages/ja.ts
tech-stack:
  added: []
  patterns:
    - "Route-level code splitting: component: () => import('@/pages/X.vue')"
    - "vue-router catch-all: { path: '/:pathMatch(.*)*', name: 'not-found' }"
    - "VueUse useDebounceFn + manual onScopeDispose cleanup (no built-in cancel in 14.3.0)"
key-files:
  created:
    - src/pages/NotFoundPage.vue
  modified:
    - src/router/index.ts
    - src/components/CitySearch.vue
    - src/i18n/messages/en.ts
    - src/i18n/messages/ja.ts
decisions:
  - "Lazy-load ALL pages including the dashboard for consistency; Vite modulepreloads the entry chunk so no real first-load penalty (resolved research question)."
  - "useDebounceFn 14.3.0 has no .cancel() and no auto scope-dispose, so unmount cleanup is a manual disposed flag + controller.abort() inside onScopeDispose - this is the real SRCH-04 cleanup."
  - "NotFoundPage never reads route.params.pathMatch and uses no v-html (threat T-05-04); teaching comments deliberately avoid the literal gate strings."
metrics:
  duration: "~5 min"
  completed: "2026-07-08"
  tasks: 3
  files: 5
---

# Phase 5 Plan 02: Navigation & Search Hardening Summary

Lazy-loaded every page route so each ships as its own Vite chunk (NAV-04), added a catch-all 404 route backed by a friendly `NotFoundPage.vue` that never touches the user-controlled path (NAV-05), and swapped CitySearch's hand-rolled `setTimeout` debounce for VueUse `useDebounceFn` with explicit `onScopeDispose` unmount cleanup (SRCH-04).

## What Was Built

### Task 1 - NotFoundPage.vue + notFound i18n keys (NAV-05) - commit 90e10f3
- New `src/pages/NotFoundPage.vue`: a `<section class="pa-4">` with a title, body, and a `v-btn :to="{ name: 'dashboard' }"` back-link, mirroring the existing CityDetailPage not-found branch.
- Renders only static `t('notFound.*')` copy; deliberately never reads or displays `route.params` and uses no `v-html` (threat T-05-04).
- Added a top-level `notFound: { title, body, backToDashboard }` section to BOTH `en.ts` and `ja.ts` (key parity preserved; `backToDashboard` count is exactly 2 per file: existing detail key + new notFound key).

### Task 2 - Lazy routes + catch-all (NAV-04, NAV-05) - commit fad9c11
- Dropped the three static page imports; every route now uses `component: () => import('@/pages/X.vue')`, dashboard included.
- Appended the catch-all LAST: `{ path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue') }`.
- Kept both `export const router` and `export default router` (existing tests import the default).
- `npm run build` emits exactly four page chunks: `DashboardPage-*.js`, `CityDetailPage-*.js`, `SettingsPage-*.js`, `NotFoundPage-*.js` (NAV-04 observable proof).

### Task 3 - useDebounceFn debounce with cleanup (SRCH-04) - commit ed658b6
- Removed the `debounceId` / `setTimeout` / `clearTimeout` bookkeeping.
- Added `const debouncedGeocode = useDebounceFn(async (text) => { ... }, 300)`: early-returns if `disposed`, validates, aborts the previous controller before creating a new one (abort-on-new-input), and toggles loading in try/catch/finally.
- Added a module-scope `let disposed = false` plus `onScopeDispose(() => { disposed = true; controller?.abort() })` for real post-unmount cleanup (threat T-05-06).
- Kept the `suppressSearch` echo guard, empty-input `resetField()` early return, `onSelect`, `cityTitle`, and the whole template contract untouched.

## Deviations from Plan

None - plan executed exactly as written. No spec edits to any existing test were needed; the full suite stayed green after the lazy-route change (navigation.spec.ts builds its own router with static imports, so it was unaffected), so no extra `flushPromises()` was required.

Note on the initial typecheck run in Task 1: `vue-tsc --build` returned a stale-incremental non-zero once and passed cleanly on immediate re-run with no source change - a build-cache artifact, not a code issue.

## Verification

- `npm run test`: 7 files, 24 tests, all passing (after both the router and CitySearch changes).
- `npm run build`: exit 0, emits exactly four page chunks (NAV-04 proof).
- Grep gates: `notFound:` present in both locales; `backToDashboard:` count == 2 per locale; no `pathMatch`/`v-html` in NotFoundPage; no `setTimeout` in CitySearch; `useDebounceFn`, `onScopeDispose`, and `geocodeCity(text, controller.signal)` all present; `export default router` present.
- Build warnings about `#__PURE__` annotations originate in `node_modules/@vueuse/core` (library-level, out of scope) - not errors.

## Threat Model Coverage

- T-05-04 (XSS via unknown path): NotFoundPage renders static i18n copy only, no route params, no v-html. Mitigated.
- T-05-05 (DoS via geocode rate): 300ms debounce retained via useDebounceFn; abort-on-new-input keeps at most one in-flight geocode. Mitigated.
- T-05-06 (resource leak after unmount): onScopeDispose disposed flag + controller.abort(). Mitigated.

## Known Stubs

None.

## Self-Check: PASSED
- FOUND: src/pages/NotFoundPage.vue
- FOUND: src/router/index.ts
- FOUND: src/components/CitySearch.vue
- FOUND commit: 90e10f3 (Task 1)
- FOUND commit: fad9c11 (Task 2)
- FOUND commit: ed658b6 (Task 3)
