# Roadmap: Vue Weather Dashboard

## Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped 2026-06-14)
- 🚧 **v1.1 Code Quality + Richer Weather** - Phases 5-7 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) - SHIPPED 2026-06-14</summary>

- [x] Phase 1: Foundation & Shell (1/1 plans) - completed 2026-06-11
- [x] Phase 2: First Weather Slice (2/2 plans) - completed 2026-06-12
- [x] Phase 3: Detail & Charts (1/1 plans) - completed 2026-06-12
- [x] Phase 4: Preferences, i18n & Tests (3/3 plans) - completed 2026-06-14

Full phase details archived in `milestones/v1.0-ROADMAP.md`.

</details>

### 🚧 v1.1 Code Quality + Richer Weather (In Progress)

**Milestone Goal:** Fix v1.0 rough edges (reactive query composables, router gaps, theme/i18n holes) and add the next layer of real-app features - geolocation, hourly chart, city reorder, richer current data - with proper API-layer and e2e test coverage.

- [x] **Phase 5: Refactor & Hardening** - Reactive query composables + retry, lazy routes + 404 page, CitySearch cleanup, accurate error copy, vue-i18n v11 migration, MSW API tests + CitySearch component tests (completed 2026-07-08)
- [x] **Phase 6: Localized, Theme-Aware Charts** - Forecast chart adapts to theme and locale, new hourly mixed chart, vee-validate messages + WMO labels i18n-keyed (en/ja) (completed 2026-07-08)
- [ ] **Phase 7: Richer Weather & Milestone Verification** - Geolocation "use my location", drag-and-drop city reorder, richer current conditions, wind unit preference, last-updated + refresh, Playwright e2e smoke

## Phase Details (v1.1)

### Phase 5: Refactor & Hardening

**Goal**: The v1.0 rough edges are gone - data fetching is reactive with no premature requests, routing is lazy-loaded and handles unknown URLs, search is cleanly debounced, error states are accurate and recoverable, and the app runs on current vue-i18n - with the API layer and search behavior locked down by tests.
**Depends on**: Phase 4 (v1.0 shipped)
**Requirements**: DATA-04, DATA-05, NAV-04, NAV-05, SRCH-04, WTHR-03, I18N-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):

  1. Deep-linking or reloading a city detail page loads that city's data with no fetch firing before the city resolves - no lat-0/lon-0 "null island" request ever appears, and the CityDetailPage Proxy hack is gone
  2. When a weather or forecast load fails, the user sees accurate error copy (no false "city not found") and can recover with a retry button that refetches
  3. Visiting an unknown URL shows a friendly 404 page with a working link back to the dashboard, and each page ships as its own lazy-loaded chunk (visible in build output)
  4. City search debounces via VueUse `useDebounceFn` and cleans up on unmount; CitySearch component tests cover debounce, abort-on-new-input, and select-clears-field
  5. App runs on vue-i18n v11 with no deprecation warnings and all v1.0 language behavior intact; `openMeteo.ts` passes MSW-mocked tests for success, empty-result, and error shapes

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 05-01-PLAN.md - Reactive query composables + retry buttons + accurate error copy (DATA-04, DATA-05, WTHR-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02-PLAN.md - Lazy routes + 404 page + CitySearch useDebounceFn cleanup (NAV-04, NAV-05, SRCH-04)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 05-03-PLAN.md - Package legitimacy gate + vue-i18n v11 upgrade + msw install (I18N-03)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 05-04-PLAN.md - MSW API-layer tests + CitySearch component tests (TEST-04, TEST-05)

**UI hint**: yes

### Phase 6: Localized, Theme-Aware Charts

**Goal**: Charts look right in both themes and both languages - including a new hourly forecast chart - and no user-facing string remains English-only.
**Depends on**: Phase 5 (vue-i18n v11 in place before new i18n keys; reactive composables pattern for the hourly data)
**Requirements**: CHRT-03, CHRT-04, CHRT-05, I18N-04, I18N-05
**Success Criteria** (what must be TRUE):

  1. Toggling light/dark theme restyles the forecast chart immediately - colors, axis text, and legend text all match the active theme
  2. Switching language (en/ja) updates chart dataset labels, and axis dates render in the active locale's format
  3. The city detail page shows an hourly forecast chart mixing a temperature line with precipitation bars, and it reacts to city and unit changes
  4. Form validation error messages appear in the active language (en/ja)
  5. WMO weather condition labels display in the active language wherever conditions are shown

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 06-01-PLAN.md - Theme-aware + localized ForecastChart (CHRT-03, CHRT-04)

**Wave 2** *(blocked on Wave 1: shares the i18n `chart` block)*

- [x] 06-02-PLAN.md - Hourly mixed chart end-to-end: API + composable + HourlyChart (CHRT-05)

**Wave 3** *(blocked on Wave 2: shares the i18n message files)*

- [x] 06-03-PLAN.md - Localized validation messages + WMO labels (I18N-04, I18N-05)

**UI hint**: yes

### Phase 7: Richer Weather & Milestone Verification

**Goal**: The dashboard gains the next layer of real-app features - geolocation, reorderable cities, richer current conditions, wind unit preference, and manual refresh - and the whole core flow is verified end to end with Playwright.
**Depends on**: Phase 5 (reactive composables + refetch), Phase 6 (i18n key conventions for new feature strings; charts stable for e2e)
**Requirements**: GEO-01, STATE-04, WTHR-04, WTHR-05, DATA-06, TEST-06
**Success Criteria** (what must be TRUE):

  1. User can add their current location as a saved city via a "use my location" action, and sees a clear message when permission is denied or geolocation is unavailable
  2. User can reorder saved city cards by drag-and-drop, and the order survives a page reload
  3. Cards/detail show richer current conditions: feels-like, precipitation, UV index, and sunrise/sunset
  4. User can switch wind speed unit (km/h / mph) and it persists and applies wherever wind is shown; each weather card shows when its data was last updated and offers a manual refresh
  5. Playwright e2e smoke flow passes: search a city -> card appears -> open detail -> forecast list + chart render

**Plans**: 8 plans
Plans:
**Wave 1**

- [x] 07-01-PLAN.md - Package legitimacy gate + vuedraggable/@playwright-test install + Chromium browser (STATE-04, TEST-06 prep)
- [x] 07-02-PLAN.md - Richer current-conditions data layer: extended fetchCurrentWeather + CurrentWeather (WTHR-04)
- [x] 07-03-PLAN.md - Wind-unit preference foundation: WindUnit type/store + useWindSpeed composable (WTHR-05)
- [x] 07-04-PLAN.md - Geolocation composable + button: useMyLocation + GeolocationButton.vue (GEO-01)

**Wave 2** *(blocked on Wave 1: shares i18n message files / data layer / composables)*

- [x] 07-05-PLAN.md - Richer conditions + last-updated/refresh UI on WeatherCard + CityDetailPage, route-by-key fix (WTHR-04, WTHR-05, DATA-06)
- [ ] 07-06-PLAN.md - DashboardPage wiring: drag-and-drop reorder + geolocation button (GEO-01, STATE-04)

**Wave 3** *(blocked on Wave 2: shares i18n message files)*

- [ ] 07-07-PLAN.md - Settings wind-unit toggle (WTHR-05)

**Wave 4** *(blocked on Wave 3: milestone-closing verification)*

- [ ] 07-08-PLAN.md - Playwright e2e smoke test (TEST-06)

**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 5 → 6 → 7

| Phase | Milestone | Plans Complete | Status   | Completed  |
| ----- | --------- | --------------- | -------- | ---------- |
| 1. Foundation & Shell        | v1.0 | 1/1 | Complete | 2026-06-11 |
| 2. First Weather Slice       | v1.0 | 2/2 | Complete | 2026-06-12 |
| 3. Detail & Charts           | v1.0 | 1/1 | Complete | 2026-06-12 |
| 4. Preferences, i18n & Tests | v1.0 | 3/3 | Complete | 2026-06-14 |
| 5. Refactor & Hardening      | v1.1 | 4/4 | Complete    | 2026-07-08 |
| 6. Localized, Theme-Aware Charts | v1.1 | 3/3 | Complete   | 2026-07-08 |
| 7. Richer Weather & Milestone Verification | v1.1 | 5/8 | In Progress|  |

## Coverage (v1.1)

All 20 v1.1 requirements mapped to exactly one phase. See REQUIREMENTS.md traceability.

---
*Roadmap created: 2026-06-11*
*Last updated: 2026-07-09 - Phase 7 planned (8 plans, 4 waves)*
