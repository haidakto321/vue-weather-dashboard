# Milestones

## v1.0 MVP (Shipped: 2026-06-14)

**Phases completed:** 4 phases, 7 plans

**Delivered:** A working Vue 3 + TypeScript weather dashboard that searches cities, fetches live Open-Meteo data, and shows current conditions, multi-day forecasts, and temperature charts - with unit/theme/language preferences that persist across reloads.

**Key accomplishments:**

- Foundation shell: Vite + Vue 3 `<script setup>` + TypeScript + Vuetify 4 + Vue Router with responsive app bar and nav drawer
- First weather slice end to end: validated city search (vee-validate + yup) -> Pinia store -> axios + TanStack Vue Query -> weather cards with loading/error states
- Detail & charts: `/city/:id` route-param page with multi-day forecast list and a reactive Chart.js + vue-chartjs temperature chart
- Preferences & persistence: temperature unit, light/dark theme, and en/ja language - all persisted via VueUse `useLocalStorage`, alongside saved cities
- Live i18n: vue-i18n en/ja catalogues (strict key parity), runtime language switching with no flash and no missing-key warnings
- Tests: Vitest + @vue/test-utils across one store, one composable, one component; 24/24 tests pass, lint + vue-tsc clean

**Stats:**

- Git range: `e43eab6` -> `7bda4dc` (16 commits)
- Timeline: 2026-06-11 -> 2026-06-14 (4 days)
- Files changed: 48 (+5011 / -63)
- Source: ~2004 LOC (`.ts` + `.vue`)

**Stack learned:** Vue 3, TypeScript, Vite, Vuetify 4, Vue Router, Pinia, TanStack Vue Query, VueUse, vee-validate + yup, Chart.js + vue-chartjs, vue-i18n, Vitest.

---
