# Vue Weather Dashboard

## What This Is

A small, real weather dashboard built to learn modern Vue 3 development. As of v1.0 it ships end to end: search a city, fetch live Open-Meteo data via axios + TanStack Vue Query, and see current conditions cards, a multi-day forecast detail page, and a reactive Chart.js temperature chart. Temperature unit, light/dark theme, and en/ja language are all switchable at runtime and persist across reloads. The app deliberately uses the same core stack as the `ai-studio-csp` work project plus the most popular libraries in the Vue ecosystem, so that studying Vue means seeing how real production pieces fit together rather than reading toy snippets.

Audience: the developer (a Vue beginner) using it as a study/reference project.

## Core Value

Each popular Vue library has one obvious, visible job in a real app - so learning Vue is learning how the pieces connect. If everything else fails, the app must clearly demonstrate Vue 3 + the chosen stack working together end to end.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Vite + Vue 3 `<script setup>` + TypeScript project with ESLint + Prettier - v1.0
- ✓ Multi-page navigation with Vue Router (dashboard, city detail, settings) - v1.0
- ✓ Global state with Pinia (saved cities, units, theme) - v1.0
- ✓ Vuetify 4 UI shell: app bar, navigation, responsive layout, theming - v1.0
- ✓ City search with vee-validate + yup form validation - v1.0
- ✓ Fetch weather from Open-Meteo via axios, managed with TanStack Vue Query (loading/error/cache) - v1.0
- ✓ Current conditions + multi-day forecast display - v1.0
- ✓ Temperature/forecast chart with Chart.js + vue-chartjs - v1.0
- ✓ VueUse composables (useLocalStorage) used where they fit naturally - v1.0
- ✓ i18n with vue-i18n (English + Japanese), runtime language switcher - v1.0
- ✓ Persist saved cities and preferences across reloads (localStorage) - v1.0
- ✓ Vitest + @vue/test-utils tests for one store, one composable, one component (24/24 pass) - v1.0

### Active

<!-- Current scope. Building toward these. Next milestone candidates. -->

(None - v1.0 shipped. Next milestone defined via /gsd-new-milestone. Candidates: geolocation, hourly forecast, richer weather icons, reorder saved cities - see v2 enhancements.)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Keycloak / OIDC authentication - too heavy for a learning project; adds auth concepts unrelated to learning Vue core
- Micro-frontend / iframe embedding - the advanced pattern in `ai-studio-csp`, not needed to learn Vue
- Backend / own API server - Open-Meteo is the data source; no server to build
- User accounts / multi-user - single local user only
- Deployment / CI pipeline - local study project; build step is enough
- Paid or key-required APIs - keep setup friction zero

## Context

- Learner is currently studying Vue and used the `ai-studio-csp` project (a Vue 3 micro-frontend host) as the reference for "what libraries does a real project use."
- Reference stack from `ai-studio-csp`: Vue 3.5, Vite 5, Vuetify 4, Vue Router 4, vue-i18n 9, axios, Vitest 2, ESLint (airbnb-base) + Prettier. That repo uses a custom reactive store (no Pinia) and is authored in JavaScript.
- This project intentionally diverges on two points to teach current best practice: TypeScript instead of plain JS, and Pinia instead of a hand-rolled store.
- Added popular libraries not in the reference repo: Pinia, TanStack Vue Query, VueUse, Chart.js + vue-chartjs. (`landing-ade` child app already uses vee-validate + yup, so that carries over.)
- Lives in its own folder `D:\project-fpt\vue-weather-dashboard`, separate git repo, independent of `ai-studio-csp`.

**Current state (after v1.0, 2026-06-14):**
- ~2004 LOC across `.ts` + `.vue`; 16 commits over 4 days; 24/24 Vitest tests pass; lint + vue-tsc clean.
- Full stack wired and working end to end: Vue 3.5, Vite, TypeScript, Vuetify 4, Vue Router, Pinia, TanStack Vue Query, VueUse, vee-validate + yup, Chart.js + vue-chartjs, vue-i18n.
- Known tech debt: `vue-i18n@9` is npm-deprecated (v11 current); pinned v9 intentionally to match the `ai-studio-csp` reference stack - optional future migration. WMO weather-code labels kept English-only. vee-validate error copy not yet i18n-keyed.

## Constraints

- **Tech stack**: Vue 3 + TypeScript + Vite - fixed, this is the thing being learned.
- **Data source**: Open-Meteo API only, no API key - keeps setup friction at zero.
- **Scope**: Small enough to finish and understand; readability over cleverness - it is a study artifact.
- **No backend**: Frontend only; all data from the public API.
- **Dependencies**: New libraries are chosen for popularity/learning value; ask before adding anything beyond the agreed list.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TypeScript over JavaScript | Industry-standard for new 2025 Vue projects; worth learning even though reference repo is JS | ✓ Good - vue-tsc clean, types caught real errors during build |
| Pinia over custom store | Official, standard Vue state library; reference repo's custom store is non-standard | ✓ Good - clean store tests, persisted prefs/cities work well |
| Weather dashboard app (Open-Meteo) | Real data, no API key, naturally exercises tables, charts, forms, async | ✓ Good - exercised search, async fetch, charts, forms, i18n |
| TanStack Vue Query for server-state | Teaches caching/loading/error patterns that raw axios does not | ✓ Good - loading/error states for every fetch came naturally |
| Separate folder + git repo | Keep learning project fully isolated from `ai-studio-csp` work repo | ✓ Good - stayed isolated |
| Pin vue-i18n@9 (not v11) | Match `ai-studio-csp` reference stack for learning parity | ⚠️ Revisit - v9 is npm-deprecated; migrate to v11 in a future milestone |
| VueUse useLocalStorage for persistence | Standard composable; teaches VueUse where it fits | ✓ Good - added read-back validation + sync flush for immediate persistence |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-14 after v1.0 MVP milestone*
