# Roadmap: Vue Weather Dashboard

**Created:** 2026-06-11
**Mode:** Vertical MVP (each phase delivers a working end-to-end slice)
**Granularity:** Coarse
**Phases:** 4

## Phase Overview

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | 1/1 | Complete    | 2026-06-11 |
| 2 | First Weather Slice | Search a city and see its current weather, end to end | STATE-01/03, SRCH-01/02/03, DATA-01/02/03, WTHR-01 |
| 3 | 1/1 | Complete   | 2026-06-12 |
| 4 | Preferences, i18n & Tests | Units/theme/language preferences, persistence, and tests | UI-02, STATE-02, CMPS-01, I18N-01/02, PERS-01, TEST-01/02/03 |

---

## Phase Details

### Phase 1: Foundation & Shell

**Goal:** A running Vue 3 + TypeScript app that boots with `npm run dev`, shows a Vuetify app bar and navigation drawer, and routes between empty Dashboard, City Detail, and Settings pages.
**Mode:** mvp
**Requirements:** SETUP-01, SETUP-02, SETUP-03, UI-01, UI-03, NAV-01, NAV-03
**Plans:** 1/1 plans complete
Plans:

- [x] 01-01-PLAN.md — Scaffold Vite + Vue 3 + TS + Vuetify 4 + Vue Router shell; drawer navigation between Dashboard, City Detail, Settings (Walking Skeleton)

**Success Criteria**:

1. `npm run dev` serves the app and it renders without console errors
2. `npm run lint` passes and `npm test` runs a passing sample test
3. App bar + responsive navigation drawer link to Dashboard, City Detail, and Settings routes; the active route is highlighted

### Phase 2: First Weather Slice

**Goal:** From an empty dashboard, the user searches a city name, the app geocodes and fetches current weather from Open-Meteo, and shows it as a card. This is the first full vertical slice (form -> validation -> store -> axios + Vue Query -> UI).
**Mode:** mvp
**Requirements:** STATE-01, STATE-03, SRCH-01, SRCH-02, SRCH-03, DATA-01, DATA-02, DATA-03, WTHR-01
**Plans:** 2/2 plans complete
**Wave 1**

- [x] 02-01-PLAN.md — Data backbone: register Pinia + Vue Query, Open-Meteo axios client, WMO util, in-memory cities store, useCurrentWeather composable (+ store unit test)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — UI slice: debounced validated city-search autocomplete, weather card with loading/error/content + remove, DashboardPage assembly with empty-state prompt

**Success Criteria**:

1. User types a city, validation blocks empty/invalid input (vee-validate + yup), and a valid search resolves to coordinates via Open-Meteo geocoding
2. Current weather is fetched via axios through TanStack Vue Query, with visible loading and error states
3. Searched cities are kept in a Pinia store and shown as current-conditions cards on the dashboard; user can remove a city

### Phase 3: Detail & Charts

**Goal:** Clicking a city opens its detail page (route param), which shows a multi-day forecast and a temperature chart that reacts to the selected city.
**Mode:** mvp
**Requirements:** NAV-02, WTHR-02, CHRT-01, CHRT-02
**Plans:** 1/1 plans complete
Plans:

- [x] 03-01-PLAN.md — Detail slice: clickable card links -> /city/:id, route-param-driven CityDetailPage, fetchForecast (axios) + useForecast (Vue Query), multi-day ForecastList, reactive Chart.js/vue-chartjs temperature chart (+ component test)

**Success Criteria**:

1. City Detail route reads the city from its route params and loads that city's forecast
2. A multi-day forecast is displayed for the selected city
3. A Chart.js + vue-chartjs temperature chart renders and updates when the city (or unit) changes

### Phase 4: Preferences, i18n & Tests

**Goal:** Settings let the user change temperature unit, theme (light/dark), and language; choices persist across reloads; and the project has representative tests.
**Mode:** mvp
**Requirements:** UI-02, STATE-02, CMPS-01, I18N-01, I18N-02, PERS-01, TEST-01, TEST-02, TEST-03
**Plans:** 3/3 plans complete (whole-phase human-verify pending)

**Wave 1**

- [x] 04-01-PLAN.md — Preferences backbone + unit slice: install VueUse + vue-i18n, persisted preferences Pinia store + persisted cities store (VueUse useLocalStorage, with read-back validation), useTemperature composable, live unit toggle in Settings wired through card/list/chart (+ preferences store test + composable test)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — Theme slice: register light/dark Vuetify themes, useThemePreference syncing the persisted theme to Vuetify, Settings theme toggle + app-bar quick-toggle, live whole-UI switching + persistence (human-verify checkpoint)

**Wave 3** *(blocked on Waves 1-2)*

- [x] 04-03-PLAN.md — i18n slice + component test: vue-i18n en/ja catalogues, useLanguagePreference syncing the persisted language to the active locale, Settings language switcher, all chrome/page/component strings i18n-keyed, SettingsPage component test (+ whole-phase human-verify checkpoint)

**Success Criteria**:

1. User can switch temperature unit, light/dark theme, and language (en/ja) from Settings, and the UI updates live
2. Saved cities and preferences survive a page reload (localStorage, via a VueUse composable where it fits)
3. Vitest covers one Pinia store, one composable, and one component, and all tests pass

---

## Coverage

All 29 v1 requirements mapped to exactly one phase. See REQUIREMENTS.md traceability.

---
*Roadmap created: 2026-06-11*
*Last updated: 2026-06-14 after executing 04-03 (i18n slice + SettingsPage test); all 3 plans done, phase awaiting whole-phase human-verify*
</content>
