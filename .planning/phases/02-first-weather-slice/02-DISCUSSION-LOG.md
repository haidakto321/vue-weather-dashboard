# Phase 2: First Weather Slice - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 2-first-weather-slice
**Areas discussed:** Search & geocode results, Weather card content, Saved cities behavior, Loading & error states

> Note: user interrupted the question batch and chose to proceed with the recommended
> default in each area. Defaults below reflect those locked choices.

---

## Search & geocode results

| Option | Description | Selected |
|--------|-------------|----------|
| Autocomplete list | Debounced v-autocomplete; user picks exact match from geocoding results | ✓ |
| Submit then pick | Plain field + submit, show match list to choose | |
| Auto-pick first match | Field + submit, silently use first geocoding result | |

**User's choice:** Autocomplete list (recommended default).
**Notes:** Handles ambiguous city names; teaches debounced queries + disambiguation.

---

## Weather card content

| Option | Description | Selected |
|--------|-------------|----------|
| Temp + condition + icon + extras | Temp, WMO condition text, mdi icon, wind + humidity | ✓ |
| Temp + condition + icon | Lean card, still needs WMO mapping | |
| Temp only | Just the number | |

**User's choice:** Temp + condition + icon + extras (recommended default).
**Notes:** Metric/Celsius this phase; unit toggle is Phase 4.

---

## Saved cities behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Add on select, dedupe | Select adds to Pinia store, no duplicates, remove button | ✓ |
| Preview then explicit Add | Preview card + Add button before saving | |
| Add on select, allow duplicates | Each select adds a card even if present | |

**User's choice:** Add on select, dedupe (recommended default).
**Notes:** In-memory store only this phase; persistence is Phase 4.

---

## Loading & error states

| Option | Description | Selected |
|--------|-------------|----------|
| Per-card inline | Per-card Vue Query, skeleton on load, inline error, empty-state prompt | ✓ |
| Global spinner + snackbar errors | One global loader, errors via snackbar | |
| Per-card spinner + snackbar errors | Loading per card, errors to global snackbar | |

**User's choice:** Per-card inline (recommended default).
**Notes:** Distinguish city-not-found vs network error; friendly empty dashboard prompt.

---

## Claude's Discretion

- Pinia store shape, composable structure (e.g. `useCurrentWeather` wrapping `useQuery`),
  axios client setup, file layout, debounce timing, exact WMO code -> label/icon mapping.
- Search bar positioning within DashboardPage.

## Deferred Ideas

- Forecast + City Detail + chart -> Phase 3.
- Unit toggle, preferences, i18n, VueUse, localStorage persistence -> Phase 4.
- Dedicated tests -> Phase 4.
- Richer icon set / geolocation / hourly view -> v2.
