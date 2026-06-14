# Requirements: Vue Weather Dashboard

**Defined:** 2026-06-11
**Core Value:** Each popular Vue library has one obvious, visible job in a real app - so learning Vue is learning how the pieces connect.

## v1 Requirements

Requirements for the initial release. Each maps to a roadmap phase.

### Setup

- [x] **SETUP-01**: Project scaffolded with Vite + Vue 3 `<script setup>` + TypeScript and runs via `npm run dev`
- [x] **SETUP-02**: ESLint + Prettier configured and `npm run lint` passes on a clean project
- [x] **SETUP-03**: Vitest + @vue/test-utils wired so `npm test` runs and a sample test passes

### UI Shell

- [x] **UI-01**: Vuetify 4 installed with a responsive app bar and navigation drawer
- [ ] **UI-02**: Light/dark theme toggle that switches Vuetify theme
- [x] **UI-03**: Layout is responsive on mobile and desktop widths

### Navigation

- [x] **NAV-01**: Vue Router configured with Dashboard, City Detail, and Settings routes
- [ ] **NAV-02**: City Detail route reads a city identifier from its route params
- [x] **NAV-03**: Active route is reflected in the navigation UI

### State

- [ ] **STATE-01**: Pinia store holds the user's saved cities
- [x] **STATE-02**: Pinia store holds preferences (temperature unit, language, theme)
- [ ] **STATE-03**: User can add and remove saved cities through the store

### Search

- [ ] **SRCH-01**: User can search for a city by name using a form
- [ ] **SRCH-02**: Search form is validated with vee-validate + yup (non-empty, sensible length)
- [ ] **SRCH-03**: City search resolves to coordinates via Open-Meteo geocoding

### Weather Data

- [ ] **DATA-01**: Weather is fetched from Open-Meteo via axios (current + forecast)
- [ ] **DATA-02**: Requests are managed with TanStack Vue Query (caching, refetch)
- [ ] **DATA-03**: Loading and error states are shown to the user for every fetch
- [ ] **WTHR-01**: Dashboard shows current conditions for each saved city as a card
- [ ] **WTHR-02**: City Detail page shows a multi-day forecast for the selected city

### Charts

- [ ] **CHRT-01**: City Detail page renders a temperature/forecast chart with Chart.js + vue-chartjs
- [ ] **CHRT-02**: Chart updates when the selected city or unit changes

### Composables

- [x] **CMPS-01**: At least one VueUse composable is used where it fits naturally (e.g. useDark, useLocalStorage)

### Internationalization

- [x] **I18N-01**: vue-i18n configured with English and Japanese message sets
- [x] **I18N-02**: User can switch language at runtime and UI text updates

### Persistence

- [x] **PERS-01**: Saved cities and preferences persist across page reloads (localStorage)

### Testing

- [x] **TEST-01**: Unit test covers one Pinia store
- [x] **TEST-02**: Unit test covers one composable
- [x] **TEST-03**: Component test covers one component (e.g. a weather card)

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

### Enhancements

- **ENH-01**: Geolocation - detect and show weather for the user's current location
- **ENH-02**: Hourly forecast view in addition to daily
- **ENH-03**: Weather code to icon mapping with a richer icon set
- **ENH-04**: Favorite/reorder saved cities (drag and drop)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Keycloak / OIDC auth | Too heavy for a learning project; unrelated to learning Vue core |
| Micro-frontend / iframe embedding | Advanced `ai-studio-csp` pattern, not needed to learn Vue |
| Own backend / API server | Open-Meteo is the data source; no server to build |
| User accounts / multi-user | Single local user only |
| Deployment / CI | Local study project; build step is enough |
| Paid or key-required APIs | Keep setup friction at zero |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Complete |
| SETUP-02 | Phase 1 | Complete |
| SETUP-03 | Phase 1 | Complete |
| UI-01 | Phase 1 | Complete |
| UI-03 | Phase 1 | Complete |
| NAV-01 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| STATE-01 | Phase 2 | Pending |
| STATE-03 | Phase 2 | Pending |
| SRCH-01 | Phase 2 | Pending |
| SRCH-02 | Phase 2 | Pending |
| SRCH-03 | Phase 2 | Pending |
| DATA-01 | Phase 2 | Pending |
| DATA-02 | Phase 2 | Pending |
| DATA-03 | Phase 2 | Pending |
| WTHR-01 | Phase 2 | Pending |
| NAV-02 | Phase 3 | Pending |
| WTHR-02 | Phase 3 | Pending |
| CHRT-01 | Phase 3 | Pending |
| CHRT-02 | Phase 3 | Pending |
| UI-02 | Phase 4 | Pending |
| STATE-02 | Phase 4 | Done (04-01) |
| CMPS-01 | Phase 4 | Done (04-01) |
| I18N-01 | Phase 4 | Done (04-03) |
| I18N-02 | Phase 4 | Done (04-03) |
| PERS-01 | Phase 4 | Done (04-01) |
| TEST-01 | Phase 4 | Done (04-01) |
| TEST-02 | Phase 4 | Done (04-01) |
| TEST-03 | Phase 4 | Done (04-03) |

**Coverage:**

- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-06-11*
*Last updated: 2026-06-11 after initial definition*
