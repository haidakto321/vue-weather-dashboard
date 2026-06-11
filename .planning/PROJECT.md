# Vue Weather Dashboard

## What This Is

A small, real weather dashboard built to learn modern Vue 3 development. It fetches live data from the free Open-Meteo API (no API key) and presents current conditions, forecasts, and temperature charts for cities the user searches. The app deliberately uses the same core stack as the `ai-studio-csp` work project plus the most popular libraries in the Vue ecosystem, so that studying Vue means seeing how real production pieces fit together rather than reading toy snippets.

Audience: the developer (a Vue beginner) using it as a study/reference project.

## Core Value

Each popular Vue library has one obvious, visible job in a real app - so learning Vue is learning how the pieces connect. If everything else fails, the app must clearly demonstrate Vue 3 + the chosen stack working together end to end.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet - ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Scaffold a Vite + Vue 3 `<script setup>` + TypeScript project with ESLint + Prettier
- [ ] Multi-page navigation with Vue Router (dashboard, city detail, settings)
- [ ] Global state with Pinia (saved cities, units, theme)
- [ ] Vuetify 4 UI shell: app bar, navigation, responsive layout, theming
- [ ] City search with vee-validate + yup form validation
- [ ] Fetch weather from Open-Meteo via axios, managed with TanStack Vue Query (loading/error/cache)
- [ ] Current conditions + multi-day forecast display
- [ ] Temperature/forecast chart with Chart.js + vue-chartjs
- [ ] Use VueUse composables (useDark, useLocalStorage, etc.) where they fit naturally
- [ ] i18n with vue-i18n (English + Japanese), language switcher
- [ ] Persist saved cities and preferences across reloads
- [ ] Vitest + @vue/test-utils tests for at least one store, one composable, and one component

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
| TypeScript over JavaScript | Industry-standard for new 2025 Vue projects; worth learning even though reference repo is JS | - Pending |
| Pinia over custom store | Official, standard Vue state library; reference repo's custom store is non-standard | - Pending |
| Weather dashboard app (Open-Meteo) | Real data, no API key, naturally exercises tables, charts, forms, async | - Pending |
| TanStack Vue Query for server-state | Teaches caching/loading/error patterns that raw axios does not | - Pending |
| Separate folder + git repo | Keep learning project fully isolated from `ai-studio-csp` work repo | - Pending |

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
*Last updated: 2026-06-11 after initialization*
