# Phase 2: First Weather Slice - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

From an empty dashboard, the user searches a city name, the app geocodes it and
fetches current weather from Open-Meteo, and shows it as a card. This is the first
full vertical slice: form -> validation -> Pinia store -> axios + TanStack Vue Query
-> UI card.

**In scope:** city search form (vee-validate + yup), Open-Meteo geocoding, current
weather fetch via axios through Vue Query, Pinia store of saved cities (add/remove),
current-conditions cards with loading + error states. New deps added this phase
(all on the agreed PROJECT.md list): pinia, axios, @tanstack/vue-query, vee-validate, yup.

**Out of scope (later phases):** multi-day forecast + City Detail page (Phase 3),
charts (Phase 3), unit toggle / preferences store / i18n / VueUse / localStorage
persistence (Phase 4), tests as a dedicated deliverable (Phase 4). This phase's
store is in-memory only - saved cities do NOT persist across reload yet.

</domain>

<decisions>
## Implementation Decisions

### Search & geocode results
- **D-01:** Search uses a Vuetify `v-autocomplete`. As the user types (debounced),
  query Open-Meteo geocoding and show matching cities (name, admin region, country)
  so the user picks the exact one. This handles ambiguous names (many "Springfield",
  "Paris") instead of silently guessing.
- **D-02:** Validation with vee-validate + yup on the search input: non-empty and a
  sensible length (per SRCH-02). Validation blocks empty/too-short queries before
  any geocoding call.

### Weather card content
- **D-03:** Current-conditions card shows: temperature, WMO condition text, a weather
  icon (mdi - @mdi/font already installed), plus wind and humidity.
- **D-04:** Map Open-Meteo WMO weather codes to a label + icon via a small lookup
  table/util. Units stay metric (Celsius, km/h) this phase - the unit toggle is Phase 4.

### Saved cities behavior
- **D-05:** Selecting a city from the autocomplete adds it to the Pinia store and a
  card appears. Searching a city already in the store is a no-op (dedupe by a stable
  key, e.g. geocoding id or lat/lon+name). No duplicate cards.
- **D-06:** Each card has a remove button that deletes the city from the store
  (STATE-03). Store is in-memory only this phase.

### Loading & error states
- **D-07:** Per-card data fetching - each saved city card owns its own Vue Query
  (keyed by city). Card shows a skeleton/spinner while loading.
- **D-08:** Errors shown inline on the card, distinguishing city-not-found (empty
  geocoding result) from network/fetch failure. Vue Query handles caching + refetch.
- **D-09:** Empty dashboard (no saved cities) shows a friendly prompt to search a city.

### Claude's Discretion
- Exact Pinia store shape, composable structure (e.g. `useCurrentWeather` wrapping
  `useQuery`), axios client setup, file/folder layout, debounce timing, and the
  precise WMO code -> label/icon mapping are left to research + planning.
- How the search bar is positioned within DashboardPage (top of page assumed).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/ROADMAP.md` (Phase 2 section) - phase goal, requirements, success criteria
- `.planning/REQUIREMENTS.md` - STATE-01, STATE-03, SRCH-01/02/03, DATA-01/02/03, WTHR-01
- `.planning/PROJECT.md` - core value, constraints, agreed library list, key decisions

### External API (no ADR docs in repo - API is the contract)
- Open-Meteo Geocoding API: `https://geocoding-api.open-meteo.com/v1/search` - resolves
  city name -> coordinates + metadata (id, name, admin1, country, lat, lon)
- Open-Meteo Forecast API: `https://api.open-meteo.com/v1/forecast` - `current_weather`
  / current fields for a lat/lon; returns WMO weather codes

No external ADRs/specs in the repo - requirements fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/DashboardPage.vue` - currently an empty placeholder; this phase fills it
  with the search bar + weather cards.
- `src/main.ts` - app bootstrap (`createApp(App).use(router).use(vuetify)`); Phase 2
  adds `.use(pinia)` and the Vue Query plugin here.
- `@mdi/font` already installed - reuse mdi icons for weather + remove button.
- Vuetify 4 components available (v-autocomplete, v-card, v-skeleton-loader, etc.).

### Established Patterns
- `<script setup lang="ts">` + path alias `@/` (seen in router + pages).
- Router already defines `/city/:id` (city-detail) for Phase 3 - not used this phase.
- Phase 1 was a walking skeleton; Phase 2 is the first real feature slice.

### Integration Points
- New Pinia store + Vue Query plugin register in `src/main.ts`.
- Weather cards render inside `DashboardPage.vue`; search component feeds the store.

</code_context>

<specifics>
## Specific Ideas

- Mode is MVP / vertical slice: build it thin but end-to-end (form -> validation ->
  store -> axios+Vue Query -> UI), not horizontal layers.
- Readability over cleverness - this is a study artifact; each library should have one
  obvious, visible job (vee-validate=validation, Pinia=saved cities, Vue Query=server
  state/caching, axios=HTTP).

</specifics>

<deferred>
## Deferred Ideas

- Multi-day forecast + City Detail page + temperature chart - Phase 3.
- Unit toggle (°C/°F), preferences store, i18n (EN/JA), VueUse composables,
  localStorage persistence of saved cities/preferences - Phase 4.
- Dedicated unit/composable/component tests - Phase 4 (TEST-01/02/03).
- Richer weather-code icon set / geolocation / hourly view - v2 (ENH-*).

</deferred>

---

*Phase: 02-first-weather-slice*
*Context gathered: 2026-06-11*
