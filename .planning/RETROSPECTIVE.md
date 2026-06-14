# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-06-14
**Phases:** 4 | **Plans:** 7

### What Was Built
- Foundation shell: Vite + Vue 3 `<script setup>` + TypeScript + Vuetify 4 + Vue Router (responsive app bar + nav drawer).
- First weather slice end to end: validated city search (vee-validate + yup) -> Pinia store -> axios + TanStack Vue Query -> weather cards with loading/error states.
- Detail & charts: `/city/:id` route-param page with multi-day forecast list and a reactive Chart.js + vue-chartjs temperature chart.
- Preferences, persistence & i18n: unit/theme/en-ja language switchable at runtime, all persisted via VueUse `useLocalStorage`; 24/24 Vitest tests across store + composable + component.

### What Worked
- Vertical MVP slicing: each phase delivered a working end-to-end slice, so the app was demoable after every phase rather than only at the end.
- TanStack Vue Query gave loading/error states "for free" on every fetch - no hand-rolled async boilerplate.
- TypeScript + vue-tsc caught real errors during build; types paid off even on a small learning project.
- End-of-phase human-verify checkpoints kept each slice honest before moving on.

### What Was Inefficient
- REQUIREMENTS.md checkboxes and traceability went stale - phases 2/3 shipped and were human-verified but the requirements file still showed them Pending at milestone close. Had to reconcile against STATE.md/ROADMAP at archive time.
- ROADMAP.md "Phase Overview" table rows for phases 1 and 3 got garbled early and were never cleaned up (cosmetic, but carried into the archive).
- Summary one-liner extraction surfaced deviation notes instead of deliverables, so milestone accomplishments had to be written by hand.

### Patterns Established
- VueUse `useLocalStorage` with read-back validation + a sync flush for immediate persistence (avoids losing writes on fast reloads).
- One persisted Pinia store per concern (preferences vs. saved cities), each with its own unit test.
- Composables wrap server-state (`useCurrentWeather`, `useForecast`) and preference-to-framework sync (`useThemePreference`, `useLanguagePreference`).
- Strict i18n key parity between en/ja catalogues; initial locale read from sanitized localStorage to avoid a flash.

### Key Lessons
1. Keep REQUIREMENTS.md checkboxes in sync at each phase transition, not at milestone close - reconciling stale state later is error-prone.
2. Pinning a deprecated dependency (`vue-i18n@9`) for reference-stack parity is a deliberate, logged trade-off - track it as tech debt with a migration path, don't silently accept it.
3. Auto-extracted accomplishments are unreliable when summaries lead with deviation notes; write the milestone narrative from the actual deliverables.

### Cost Observations
- Model mix: not measured (no per-session telemetry captured).
- Notable: 4 phases / 7 plans / 16 commits over 4 days; 24/24 tests green, lint + vue-tsc clean at close.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Key Change |
|-----------|--------|------------|
| v1.0 | 4 | Established vertical-MVP slicing with end-of-phase human-verify |

### Cumulative Quality

| Milestone | Tests | Zero-Dep Additions |
|-----------|-------|-------------------|
| v1.0 | 24 | n/a (learning project - libraries added deliberately) |

### Top Lessons (Verified Across Milestones)

1. Keep planning artifacts (requirements/traceability) in sync per phase, not per milestone.
