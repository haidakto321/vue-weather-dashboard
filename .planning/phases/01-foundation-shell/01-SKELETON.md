# Walking Skeleton - Vue Weather Dashboard

**Phase:** 1
**Generated:** 2026-06-11

## Capability Proven End-to-End

A developer can run `npm run dev`, see a Vuetify app bar and navigation drawer, and click drawer links to move between the empty Dashboard, City Detail, and Settings pages with the active route highlighted - the full Vue 3 + TypeScript + Vite + Vuetify + Vue Router stack working together end to end, with no real data yet.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Vue 3 (`<script setup>`) + TypeScript via Vite | Fixed by the project - this is the thing being learned (CLAUDE.md). Latest stable: vue@3.5, vite@8. |
| UI library | Vuetify 4 (mdi icon set, default light theme) | ROADMAP requires Vuetify 4; provides the app bar + responsive drawer out of the box (UI-01/UI-03). Wired via vite-plugin-vuetify autoImport so components are tree-shaken and beginner-friendly. |
| Routing | Vue Router 5, `createWebHistory` | Standard Vue routing; named routes keep links readable. Routes: `/` (dashboard), `/city/:id` (city-detail), `/settings` (settings). |
| Data layer | None this phase | Frontend only, Open-Meteo only, no backend (CLAUDE.md). Real fetch via axios + TanStack Vue Query starts Phase 2. No DB ever (browser localStorage arrives Phase 4). |
| State | None this phase | Pinia stores start Phase 2 (saved cities) and Phase 4 (preferences). |
| Testing | Vitest + @vue/test-utils + jsdom | Component mounting for the E2E navigation test and the sample test (SETUP-03). |
| Lint/format | ESLint 10 + Prettier 3 (configs made to coexist) | `npm run lint` is the quality gate (SETUP-02). |
| Directory layout | `src/{main.ts, App.vue, plugins/, router/, layouts/, pages/, __tests__/}` | Flat, conventional, readable. `pages/` holds route views; `layouts/AppShell.vue` holds the app-bar + drawer chrome; `plugins/` isolates Vuetify setup. Later phases add `src/{stores/, composables/, services/, components/, locales/}`. |

## Stack Touched in Phase 1

- [x] Project scaffold (Vite + Vue 3 + TS, ESLint, Prettier, Vitest)
- [x] Routing - three real routes (Dashboard, City Detail, Settings)
- [ ] Database - intentionally none (frontend-only project; localStorage persistence is Phase 4)
- [x] UI - interactive navigation drawer wired to the router (the real end-to-end interaction)
- [x] Local full-stack run command - `npm run dev` (deployment/CI explicitly out of scope per REQUIREMENTS.md)

## Out of Scope (Deferred to Later Slices)

- Any weather data, Open-Meteo geocoding/forecast calls, axios, TanStack Vue Query (Phase 2)
- Pinia stores for saved cities and preferences (Phases 2 and 4)
- Search form, vee-validate + yup validation (Phase 2)
- City Detail reading its `:id` param to load a city, multi-day forecast (Phase 3)
- Chart.js + vue-chartjs temperature chart (Phase 3)
- Light/dark theme toggle (UI-02), vue-i18n en/ja switching, VueUse composables, localStorage persistence (Phase 4)
- Real tests of stores/composables/components (Phase 4); Phase 1 ships only the sample + navigation tests
- Deployment, CI, user accounts, auth (Out of Scope in REQUIREMENTS.md)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without changing its architectural decisions:

- Phase 2: From the empty Dashboard, search a city -> geocode + fetch current weather (axios + Vue Query) -> show it as a card; saved cities live in a Pinia store.
- Phase 3: Click a city -> City Detail reads `:id`, loads a multi-day forecast and a Chart.js temperature chart that reacts to the selected city/unit.
- Phase 4: Settings page gains unit/theme/language controls (Vuetify theme, vue-i18n en/ja, VueUse), preferences + saved cities persist to localStorage, and representative Vitest tests cover a store, a composable, and a component.
