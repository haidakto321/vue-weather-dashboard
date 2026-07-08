---
phase: 06-localized-theme-aware-charts
resolution: "WR-01 fixed in 43cf556 (local-time date parse). WR-02 + IN-01/02/03 deferred as follow-ups."
reviewed: 2026-07-08T17:38:23Z
depth: deep
files_reviewed: 15
files_reviewed_list:
  - src/components/ForecastChart.vue
  - src/components/HourlyChart.vue
  - src/components/CitySearch.vue
  - src/components/WeatherCard.vue
  - src/components/ForecastList.vue
  - src/composables/useHourlyForecast.ts
  - src/lib/openMeteo.ts
  - src/lib/wmo.ts
  - src/types/weather.ts
  - src/pages/CityDetailPage.vue
  - src/i18n/messages/en.ts
  - src/i18n/messages/ja.ts
  - src/__tests__/cityDetail.spec.ts
  - src/__tests__/i18nParity.spec.ts
  - src/__tests__/openMeteo.spec.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-07-08T17:38:23Z
**Depth:** deep
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 06 wires theme + locale reactivity into the charts, adds a mixed line+bar
`HourlyChart`, refactors WMO labels to i18n keys, and closes the en/ja parity gap
with a dedicated test. The core reactivity design is sound: `chartOptions` and
`chartData` are computeds that read `theme.current.value.dark`, `t()`, `locale`, and
`unitSymbol.value` inside the computed body, and the `:key` remount fires correctly
because the app toggles the theme via `vuetifyTheme.change('light'|'dark')`, so
`theme.name.value` really does change. The abort/cleanup path in `CitySearch` is
intact, the untrusted route `:id` is only ever used to look up a saved city (never to
build a request), and all API params go through axios `params` (URL-encoded). The new
`useHourlyForecast` correctly mirrors `useForecast` with an `enabled` gate and a
`toValue()`-based re-check instead of a `!` assertion.

No security issues and no crash/data-loss blockers were found. The findings below are
two correctness/robustness defects (Warning) and three quality items (Info).

The single most important finding is **WR-01**: the newly added date labels in
`ForecastChart` parse date-only ISO strings with `new Date('YYYY-MM-DD')`, which is
interpreted as UTC midnight and can render the wrong weekday/day in negative-UTC-offset
timezones.

## Warnings

### WR-01: Date-only labels parsed as UTC shift by a day in negative-offset timezones

**File:** `src/components/ForecastChart.vue:48-54` (also latent in `src/components/ForecastList.vue:23-29`)
**Issue:** The new x-axis labels do `new Date(iso).toLocaleDateString(...)` where `iso`
is a date-only string. Per `src/types/weather.ts:40`, `DailyForecast.dates` are
`'YYYY-MM-DD'`, and `new Date('2026-07-08')` is parsed as **UTC** midnight. When
`toLocaleDateString` then renders in the browser's local timezone, any negative UTC
offset (e.g. the Americas) rolls the label back to the previous day - so the chart (and
`ForecastList`, which uses the same pattern) shows "Mon 7" for the API's "Tue 8". This
is a genuine off-by-one-day display bug newly introduced into the chart this phase
(previously the chart used the raw strings). The hourly chart is unaffected because its
`times` are datetime-local strings (`YYYY-MM-DDTHH:MM`), which parse as local time.
**Fix:** Parse the date as local, not UTC. For example add a day-safe local parse:
```ts
// date-only -> local midnight (avoids the UTC parse shift)
function toLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
// ...
labels: props.forecast.dates.map((iso) =>
  toLocalDate(iso).toLocaleDateString(dateLocale.value, {
    weekday: 'short', day: 'numeric', month: 'short',
  }),
),
```
Apply the same helper in `ForecastList.vue` so list and chart stay consistent and both
correct.

### WR-02: Hourly section shows a bare heading and silently swallows the error state

**File:** `src/pages/CityDetailPage.vue:90-91`
**Issue:** The "Hourly forecast" heading renders unconditionally inside the
`v-else-if="forecast"` block, but the chart is `<HourlyChart v-if="hourly">`. The
composable exposes `isPending`/`isError` (destructured from `useQuery`) yet the page
only consumes `data: hourly`. Result: while the hourly query is loading the user sees a
heading with empty space under it, and if the hourly fetch **errors**, the failure is
silent - just a dangling heading, no spinner, no retry, no message. This diverges from
the daily forecast right above it, which handles `isPending`/`isError` explicitly. For a
study/reference app whose core value is "each piece has one obvious visible job," a
silently-failing chart is a real robustness gap, not just polish.
**Fix:** Destructure the states and render loading/error, or at minimum gate the heading
with the chart so nothing dangles:
```vue
const { data: hourly, isPending: hourlyPending, isError: hourlyError } = useHourlyForecast(city)
```
```vue
<template v-if="hourly">
  <h2 class="text-h6 mb-2 mt-4">{{ t('detail.hourlyHeading') }}</h2>
  <HourlyChart :hourly="hourly" />
</template>
<v-progress-circular v-else-if="hourlyPending" indeterminate color="primary" class="my-4" />
<v-alert v-else-if="hourlyError" type="error" variant="tonal" density="compact">
  {{ t('detail.loadError') }}
</v-alert>
```

## Info

### IN-01: Locale switch does not re-translate an already-visible validation error

**File:** `src/components/CitySearch.vue:24-37`
**Issue:** The schema comment claims "a language switch produces a new schema identity
and vee-validate re-validates in the new language." But `useField` is created with
`validateOnValueUpdate: false`, and validation only ever runs inside the debounced
geocode (`validate()` at line 63). Nothing re-runs validation when `locale` changes, so
an error that is currently displayed (e.g. "Type at least 2 characters") stays in the
old language until the next keystroke triggers a new validate. The functional path is
fine; only the comment overstates the behavior.
**Fix:** Either correct the comment, or make it true by re-validating on locale change
when an error is showing:
```ts
watch(() => locale.value, () => { if (errorMessage.value) validate() })
```

### IN-02: Theme-color and locale-tag logic duplicated across the two chart components

**File:** `src/components/ForecastChart.vue:78-96` and `src/components/HourlyChart.vue:87-110`
**Issue:** The `dark`-driven `textColor`/`gridColor` computation and the
`locale === 'ja' ? 'ja-JP' : 'en-GB'` mapping are copy-pasted between the two charts
(the latter also duplicated in `ForecastList.vue:20`). Duplication means a future theme
or locale change has three edit sites and can silently drift. Readability-over-cleverness
is a project value, so a tiny shared helper (not a new dependency) is justified here.
**Fix:** Extract `useChartTheme()` returning `{ textColor, gridColor }` and a
`localeToBcp47(locale)` helper in `src/composables` or `src/lib`, and consume both from
all three sites.

### IN-03: Chart brand hues are inline magic hex values repeated per dataset

**File:** `src/components/ForecastChart.vue:59-67`, `src/components/HourlyChart.vue:66-76`
**Issue:** `#e53935` (temp/high) and `#1e88e5` (low/precip) are hardcoded in multiple
datasets across both charts. Not a bug, but centralizing them as named constants would
keep the high-temp and precipitation series visually consistent and make a palette
change one-line.
**Fix:** Define `const SERIES = { warm: '#e53935', cool: '#1e88e5' }` in a shared module
and reference it in both charts.

---

_Reviewed: 2026-07-08T17:38:23Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
