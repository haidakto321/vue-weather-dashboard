---
phase: 06-localized-theme-aware-charts
plan: 03
subsystem: i18n
tags: [vue, vue-i18n, vee-validate, yup, wmo, i18n-parity, localization]

# Dependency graph
requires:
  - phase: 06
    plan: 01
    provides: the `chart` i18n block + en/ja parity discipline
  - phase: 06
    plan: 02
    provides: extended `chart` / `detail` i18n keys (en/ja parity baseline)
provides:
  - i18n-keyed CitySearch validation via a computed yup schema (locale-reactive rules)
  - labelKey-based wmo.ts (Condition.label -> Condition.labelKey) rendered through t() at card + forecast-list sites
  - validation.* + wmo.* message blocks (en + ja parity)
  - src/__tests__/i18nParity.spec.ts (recursive en/ja key-set equality)
affects: [city search validation, dashboard cards, detail forecast list, i18n message parity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Computed yup schema passed as reactive `rules` to useField (MaybeRef) so validation copy re-translates on locale switch"
    - "Domain util returns a message key (labelKey), not a display string; render site owns t()"
    - "en/ja key-set parity guarded by an automated recursive-equality test (Pitfall 7)"

key-files:
  created:
    - src/__tests__/i18nParity.spec.ts
  modified:
    - src/components/CitySearch.vue
    - src/lib/wmo.ts
    - src/components/WeatherCard.vue
    - src/components/ForecastList.vue
    - src/i18n/messages/en.ts
    - src/i18n/messages/ja.ts

key-decisions:
  - "wmo.ts keeps the icon map + wmoToCondition signature; only the human label became a message key (labelKey: 'wmo.<code>')"
  - "validateOnValueUpdate: false preserved on useField (stale required-error guard) while making the schema a locale-reactive computed"
  - "Parity enforced by test, not convention - the wmo block alone adds 29 keys/locale, easy to desync manually"

patterns-established:
  - "Locale-reactive form validation: computed yup schema referencing t() handed to useField as MaybeRef rules"
  - "Message-key return from domain utils (labelKey) with translation deferred to the render site"

requirements-completed: [I18N-04, I18N-05]

# Metrics
duration: interrupted-then-resumed
completed: 2026-07-09
---

# Phase 6 Plan 03: Close Last English-Only Strings Summary

**Every user-facing string now lives in the locale files: CitySearch validation messages come from a computed yup schema that re-translates on locale switch (I18N-04), and the 28 WMO condition labels plus fallback moved out of wmo.ts into wmo.* message keys rendered at the card and forecast-list sites (I18N-05) - with an automated en/ja parity test proving the two locales stay in sync.**

## Performance

- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 5
- **Note:** Execution was interrupted by a session rate limit after Task 1 committed; Task 2's code was already written on the working tree, so the orchestrator verified (37/37 tests, tsc + build clean), committed Task 2, and finished tracking inline rather than re-dispatching a fresh executor.

## Accomplishments
- Wrapped the CitySearch yup schema in a `computed` reading `t('validation.cityRequired' / 'cityMin' / 'cityMax')`, passed as the reactive `rules` to `useField`; `validateOnValueUpdate: false` preserved (stale-error guard). Out-of-scope comment updated to note validation copy is now i18n-keyed (I18N-04).
- Changed `wmo.ts` `Condition.label` -> `Condition.labelKey`; `WMO_TABLE` / `FALLBACK` values became `labelKey: 'wmo.<code>'` / `'wmo.unknown'`. Icon map + `wmoToCondition` signature unchanged.
- `WeatherCard.vue` + `ForecastList.vue` now render `t(condition.labelKey)` / `t(day.condition.labelKey)`.
- Added `validation.*` (3 keys) + `wmo.*` (28 numeric-code keys + `unknown` = 29 keys) blocks to both en.ts and ja.ts (parity).
- New `src/__tests__/i18nParity.spec.ts` asserting recursive en/ja key-set equality (guards Pitfall 7).

## Task Commits

Each task was committed atomically:

1. **Task 1: i18n-keyed CitySearch validation (I18N-04)** - `0f74368` (feat)
2. **Task 2: i18n WMO condition labels + en/ja parity test (I18N-05)** - `059bad4` (feat)

## Files Created/Modified
- `src/components/CitySearch.vue` - computed locale-reactive yup schema fed to useField; updated out-of-scope comment.
- `src/lib/wmo.ts` - `label` -> `labelKey`; table/fallback values are `wmo.<code>` message keys.
- `src/components/WeatherCard.vue` - renders `t(condition.labelKey)`.
- `src/components/ForecastList.vue` - renders `t(day.condition.labelKey)`.
- `src/i18n/messages/en.ts` / `src/i18n/messages/ja.ts` - new `validation` + `wmo` blocks (parity).
- `src/__tests__/i18nParity.spec.ts` (NEW) - recursive en/ja key-set equality test.

## Decisions Made
- Only the human label became a message key; the WMO icon map and `wmoToCondition` signature stayed in the util (minimal blast radius).
- Parity is enforced by an automated test rather than by convention - the wmo block alone adds 29 keys per locale.

## Deviations from Plan
- None to the code. Process deviation only: a session rate limit interrupted the executor after Task 1's commit. Task 2's working-tree code was already complete, so recovery finished it inline (verify -> commit -> summary -> tracking) instead of spawning a new executor - avoiding duplicate work and extra token cost.

## Issues Encountered
- Session rate limit mid-plan (see above). No code impact. `npx vue-tsc --build` exit 0; `npm run test -- --run` 37/37 pass (includes the new parity test); `npm run build` exit 0. Canvas `getContext` messages are jsdom noise, not failures.

## User Setup Required
None. Human-check available: `npm run dev`, trigger a CitySearch validation error then switch language (error text switches locale); confirm WMO condition labels on cards + forecast list localize on language switch.

## Next Phase Readiness
- I18N-04 + I18N-05 complete. All user-facing strings are now localized with an automated parity guard.
- No blockers. Phase 06 requirements (CHRT-03/04/05, I18N-04/05) all satisfied.

## Self-Check: PASSED

Both task commits (0f74368, 059bad4) verified in git history; new parity test present and passing; wmo.ts labelKey refactor + render-site updates verified on disk.

---
*Phase: 06-localized-theme-aware-charts*
*Completed: 2026-07-09*
