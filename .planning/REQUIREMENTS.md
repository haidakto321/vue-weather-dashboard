# Requirements: Vue Weather Dashboard - Milestone v1.1

**Defined:** 2026-07-07
**Core Value:** Each popular Vue library has one obvious, visible job in a real app - so learning Vue is learning how the pieces connect.
**Milestone goal:** Fix v1.0 rough edges (reactive composables, router gaps, theme/i18n holes) and add the next layer of real-app features with proper API-layer and e2e test coverage.

REQ-ID numbering continues from v1.0 (see `.planning/milestones/v1.0-REQUIREMENTS.md`).

## v1.1 Requirements

### Server State (DATA)

- [x] **DATA-04**: Weather/forecast composables accept a reactive city (`MaybeRefOrGetter<SavedCity | undefined>`) with an `enabled` guard - no fetch fires when no city is resolved (removes the CityDetailPage Proxy hack and the lat-0/lon-0 "null island" fetch)
- [x] **DATA-05**: User can retry a failed weather or forecast load via a retry button (Vue Query `refetch`)
- [ ] **DATA-06**: User can see when a card's data was last updated and manually refresh it

### Navigation (NAV)

- [x] **NAV-04**: Page routes are lazy-loaded so each page ships as its own chunk
- [x] **NAV-05**: User visiting an unknown URL sees a friendly 404 page with a link back to the dashboard

### Charts (CHRT)

- [x] **CHRT-03**: Forecast chart colors, axis and legend text adapt to the active light/dark theme
- [x] **CHRT-04**: Chart dataset labels are i18n-keyed and axis dates render in the active locale
- [x] **CHRT-05**: User can see an hourly forecast chart on the detail page (temperature line + precipitation bars, mixed chart)

### Weather Display (WTHR)

- [x] **WTHR-03**: Card error copy is accurate - dead 404 "city not found" branch removed from WeatherCard error mapping
- [x] **WTHR-04**: User can see richer current conditions on cards/detail: feels-like, precipitation, UV index, sunrise/sunset
- [x] **WTHR-05**: User can switch wind speed unit (km/h / mph); choice persists and applies wherever wind is shown

### Search (SRCH)

- [x] **SRCH-04**: CitySearch debounce uses VueUse `useDebounceFn` with proper cleanup on unmount (replaces hand-rolled `setTimeout`)

### Geolocation (GEO)

- [ ] **GEO-01**: User can add their current location as a saved city via a "use my location" action (VueUse `useGeolocation` + Open-Meteo reverse geocoding), with a clear denied/unavailable state

### Saved Cities (STATE)

- [ ] **STATE-04**: User can reorder saved cities by drag-and-drop (vuedraggable); order persists across reload

### i18n (I18N)

- [x] **I18N-03**: vue-i18n migrated from v9 to v11 with no deprecation warning and all existing i18n behavior intact
- [x] **I18N-04**: vee-validate error messages are i18n-keyed (en/ja)
- [x] **I18N-05**: WMO weather condition labels are i18n-keyed (en/ja)

### Testing (TEST)

- [x] **TEST-04**: `openMeteo.ts` API layer covered by MSW-mocked tests (success, empty result, error shapes)
- [x] **TEST-05**: CitySearch component tests cover debounce, abort-on-new-input, and select-clears-field behavior
- [ ] **TEST-06**: Playwright e2e smoke flow passes: search a city -> card appears -> open detail -> forecast list + chart render

## Future Requirements

<!-- Deferred beyond v1.1. -->

- Richer weather icons / animated conditions (deferred - visual polish, low learning value now)
- Multi-day hourly drill-down per forecast day

## Out of Scope

| Item | Reason |
|------|--------|
| PWA / offline (`vite-plugin-pwa`, `persistQueryClient`) | Explicitly rejected during v1.1 scoping - dependency footprint not worth it for a study project |
| Keycloak / OIDC auth, backend, multi-user, deployment/CI | Carried over from v1.0 out-of-scope decisions |
| Paid or key-required APIs | Open-Meteo only; zero setup friction |

## Approved New Dependencies

- `msw` (dev) - API-layer test mocking
- `vuedraggable` - saved-city reorder
- `@playwright/test` (dev) - e2e smoke flow

No other new dependencies without explicit approval.

## Traceability

<!-- Filled by roadmapper: REQ-ID -> Phase mapping. -->

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DATA-04 | Phase 5 | Complete |
| DATA-05 | Phase 5 | Complete |
| NAV-04 | Phase 5 | Complete |
| NAV-05 | Phase 5 | Complete |
| SRCH-04 | Phase 5 | Complete |
| WTHR-03 | Phase 5 | Complete |
| I18N-03 | Phase 5 | Complete |
| TEST-04 | Phase 5 | Complete |
| TEST-05 | Phase 5 | Complete |
| CHRT-03 | Phase 6 | Complete |
| CHRT-04 | Phase 6 | Complete |
| CHRT-05 | Phase 6 | Complete |
| I18N-04 | Phase 6 | Complete |
| I18N-05 | Phase 6 | Complete |
| GEO-01 | Phase 7 | Pending |
| STATE-04 | Phase 7 | Pending |
| WTHR-04 | Phase 7 | Complete |
| WTHR-05 | Phase 7 | Complete |
| DATA-06 | Phase 7 | Pending |
| TEST-06 | Phase 7 | Pending |

**Coverage:** 20/20 v1.1 requirements mapped. No orphans, no duplicates.

---
*Requirements defined: 2026-07-07*
*Last updated: 2026-07-07 - traceability filled by roadmapper (Phases 5-7)*
