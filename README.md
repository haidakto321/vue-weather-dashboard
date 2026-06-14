# Vue Weather Dashboard

A small, real weather dashboard built to learn modern Vue 3. Search a city, fetch live data from the free [Open-Meteo](https://open-meteo.com/) API (no API key), and see current conditions, a multi-day forecast, and a temperature chart. Temperature unit, light/dark theme, and language (English / Japanese) are switchable at runtime and persist across reloads.


## Tech Stack

| Tool | Version | Job in this app |
|------|---------|-----------------|
| [Vue 3](https://vuejs.org/) | ^3.5.38 | UI framework (`<script setup>` SFCs) |
| [TypeScript](https://www.typescriptlang.org/) | ~6.0.3 | Static typing across app + tests |
| [Vite](https://vite.dev/) | ^8.0.16 | Dev server + build tool |
| [Vue Router](https://router.vuejs.org/) | ^5.1.0 | Routing: Dashboard, City Detail (`/city/:id`), Settings |
| [Pinia](https://pinia.vuejs.org/) | ^3.0.4 | Global state: saved cities + preferences |
| [Vuetify 4](https://vuetifyjs.com/) | ^4.1.1 | Material UI components, app bar, nav drawer, theming |
| [TanStack Vue Query](https://tanstack.com/query) | ^5.101.0 | Server-state: caching, loading/error, refetch |
| [axios](https://axios-http.com/) | ^1.17.0 | HTTP client for Open-Meteo requests |
| [VueUse](https://vueuse.org/) | ^14.3.0 | Composables - `useLocalStorage` for persistence |
| [vee-validate](https://vee-validate.logaretm.com/) | ^4.15.1 | City-search form validation |
| [yup](https://github.com/jquense/yup) | ^1.7.1 | Validation schema for the search form |
| [Chart.js](https://www.chartjs.org/) | ^4.5.1 | Temperature chart rendering |
| [vue-chartjs](https://vue-chartjs.org/) | ^5.3.3 | Vue wrapper for Chart.js |
| [vue-i18n](https://vue-i18n.intlify.dev/) | ^9.14.5 | Internationalization - English + Japanese |
| [@mdi/font](https://pictogrammers.com/library/mdi/) | ^7.4.47 | Material Design Icons |

### Tooling (dev)

| Tool | Version | Job |
|------|---------|-----|
| [Vitest](https://vitest.dev/) | ^4.1.8 | Unit + component tests |
| [@vue/test-utils](https://test-utils.vuejs.org/) | ^2.4.11 | Mount/test Vue components |
| [jsdom](https://github.com/jsdom/jsdom) | ^29.1.1 | DOM environment for tests |
| [ESLint](https://eslint.org/) | ^10.4.1 | Linting (Vue + TypeScript configs) |
| [Prettier](https://prettier.io/) | ^3.8.4 | Code formatting |
| [vue-tsc](https://github.com/vuejs/language-tools) | ^3.3.4 | Type-check `.vue` files in the build |
| [vite-plugin-vuetify](https://github.com/vuetifyjs/vuetify-loader) | ^2.1.3 | Vuetify auto-import + treeshaking |

## Data Source

[Open-Meteo](https://open-meteo.com/) - free, no API key:
- Geocoding API: city name -> coordinates
- Forecast API: current conditions + multi-day forecast

## Scripts

```bash
npm run dev       # start Vite dev server
npm run build     # type-check (vue-tsc) + production build
npm run preview   # preview the production build
npm run lint      # ESLint
npm test          # run Vitest once
```

## Notes

- Frontend only - no backend; all data comes from the public Open-Meteo API.
- `vue-i18n` is pinned to v9 (npm-deprecated; v11 is current) to match the reference stack used for learning. Optional future migration.
