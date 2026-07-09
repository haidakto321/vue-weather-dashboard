---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Code Quality + Richer Weather
status: verifying
stopped_at: 07-08 complete - all Phase 07 requirements (GEO-01, STATE-04, WTHR-04, WTHR-05, DATA-06, TEST-06) implemented and verified; ready for phase verification
last_updated: "2026-07-09T14:01:04.952Z"
last_activity: 2026-07-08 -- Phase 07 execution started
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 15
  completed_plans: 15
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-07)

**Core value:** Each popular Vue library has one obvious, visible job in a real app - so learning Vue is learning how the pieces connect.
**Current focus:** Phase 07 — Richer Weather & Milestone Verification

## Current Position

Phase: 07 (Richer Weather & Milestone Verification) — EXECUTING
Plan: 8 of 8
Status: Phase complete — ready for verification
Last activity: 2026-07-08 -- Phase 07 execution started

Progress: [██████████] 100% (Phase 06 plans: 3/3)

## Performance Metrics

**Velocity (v1.0):**

- Total plans completed: 11 (Phases 1-4, 2026-06-11 -> 2026-06-14)
- v1.1 plans completed: 1

**By Phase (v1.1):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 5 P1 | 5min | 3 tasks | 6 files |
| Phase 05 P04 | 4min | 2 tasks | 2 files |
| 05 | 4 | - | - |
| Phase 06 P01 | 4min | 2 tasks | 3 files |
| Phase 06 P02 | 3min | 2 tasks | 9 files |
| Phase 07 P01 | 6min | 2 tasks | 2 files |
| Phase 07 P02 | 5min | 2 tasks | 4 files |
| Phase 07 P03 | 3min | 2 tasks | 5 files |
| Phase 07-richer-weather-milestone-verification P04 | 5min | 2 tasks | 5 files |
| Phase 07-richer-weather-milestone-verification P05 | 25min | 2 tasks | 6 files |
| Phase 07 P06 | 3min | 2 tasks | 4 files |
| Phase 07 P07 | 6min | 1 tasks | 4 files |
| Phase 07 P08 | 25min | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.0: vue-i18n pinned at v9 for reference-stack parity - now npm-deprecated; v1.1 Phase 5 migrates to v11 (I18N-03)
- v1.0: WMO labels kept English-only and vee-validate copy not i18n-keyed - v1.1 Phase 6 closes both (I18N-04/05)
- v1.1 scoping: approved new deps are msw (dev), vuedraggable, @playwright/test (dev) only; PWA explicitly rejected
- v1.1 sequencing: refactor/foundation first (reactive composables, router, i18n v11) because later features build on it; Playwright e2e is the milestone-closing verification
- [Phase 5]: ja retry copy is the short imperative 再試行, matching existing ja locale copy style - consistency with detail.backToDashboard
- [Phase 5]: queryFn uses guard-throw instead of non-null assertion when city is unresolved - safer and teaches why the enabled gate exists (RESEARCH Pitfall 1)
- [Phase 5]: API-layer tests use MSW node interception; component tests stub the HTTP module - two documented strategies (TEST-04/05)
- [Phase ?]: [Phase 6]: only chart chrome (ticks/grid/legend) is theme-driven; fixed brand hues #e53935/#1e88e5 stay constant across themes
- [Phase ?]: [Phase 6]: dateLocale computed copied verbatim from ForecastList so chart x-axis dates localize identically
- [Phase ?]: forecast_days=1 (24 points) keeps the hourly chart readable (Pitfall 5)
- [Phase ?]: Precipitation exempt from unit toggle - mm on its own right y1 axis (Pitfall 8)
- [Phase 07]: vuedraggable pinned to ^4.1.0 (never bare install) since npm latest dist-tag resolves to Vue-2-only 2.24.3
- [Phase 07]: @playwright/test installed strictly as devDependency to keep browser-automation code out of the production bundle
- [Phase 07]: sunrise/sunset fetched via daily block with forecast_days=1 in the SAME request as current conditions - no new HTTP round trip
- [Phase 07]: precipitation and uvIndex have no unit toggle (mm and 0-11+ scale) - matches existing precipitation convention
- [Phase ?]: [Phase 07] useWindSpeed.format() adds a space before the unit symbol (20 km/h), unlike useTemperature (21°C), since a two-letter unit doesn't read naturally attached to the number
- [Phase ?]: [Phase 07] GEO-01 uses a static 'My Location' i18n label instead of reverse geocoding - Open-Meteo has no lat/lon -> place-name endpoint
- [Phase ?]: card.wind i18n key parameterized to '{value} {unit}' for consistency with chart.tempHigh, though WeatherCard/CityDetailPage call sites render wind via useWindSpeed().format() directly
- [Phase ?]: CityDetailPage's current-conditions panel nests inside the existing forecast v-else-if block to keep Vue's v-if/v-else-if chain contiguous, rather than sitting as a sibling before it
- [Phase ?]: reorderCities reassigns cities.value wholesale (mirrors addCity/removeCity) so useLocalStorage persists drag-and-drop order for free
- [Phase ?]: vuedraggable wrapper uses tag="div" plus a v-col inside the #item slot - never a Vuetify component object as the tag prop
- [Phase 07]: Wind-unit toggle placed directly after temperature-unit card, before theme card, matching plan-specified ordering
- [Phase 07-08]: Downgraded vite from ^8.0.16 to ^7.3.6 (user-approved) to fix a Rolldown dev pre-bundler bug that crashed vue-router@5.1.0 at mount time in a real browser
- [Phase 07-08]: vitest.config.ts excludes e2e/ so Vitest's default glob does not also pick up Playwright's smoke.spec.ts (test-runner collision)

### Pending Todos

None yet.

### Blockers/Concerns

- RESOLVED (05-01): CityDetailPage Proxy hack + lat-0/lon-0 fetch removed by DATA-04; downstream features (GEO-01, CHRT-05) build on the reactive composables (MaybeRefOrGetter + enabled guard)

## Deferred Items

Items acknowledged and carried forward:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Visual polish | Richer weather icons / animated conditions | Deferred (low learning value) | v1.1 scoping |
| Feature | Multi-day hourly drill-down per forecast day | Deferred | v1.1 scoping |

## Session Continuity

Last session: 2026-07-09T14:00:57.474Z
Stopped at: 07-08 complete - all Phase 07 requirements (GEO-01, STATE-04, WTHR-04, WTHR-05, DATA-06, TEST-06) implemented and verified; ready for phase verification
Resume file: None

---
*Last updated: 2026-07-08 - Plan 05-04 complete (openMeteo MSW + CitySearch tests). Phase 05 complete; next: Phase 06.*
