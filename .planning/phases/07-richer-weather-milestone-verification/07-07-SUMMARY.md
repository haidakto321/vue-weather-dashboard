---
phase: 07-richer-weather-milestone-verification
plan: 07
subsystem: settings-ui
tags: [i18n, preferences, vuetify, tdd]
dependency_graph:
  requires:
    - src/stores/preferences.ts (windUnit/setWindUnit, built in Plan 07-03)
    - src/composables/useWindSpeed.ts (consumed by WeatherCard/CityDetailPage, wired in Plan 07-05)
  provides:
    - "Wind-unit v-btn-toggle control on SettingsPage.vue (data-testid=\"wind-unit-toggle\")"
    - "settings.windUnitSection / settings.kmh / settings.mph i18n keys (en/ja)"
  affects:
    - src/pages/SettingsPage.vue
tech_stack:
  added: []
  patterns:
    - "New settings toggle mirrors the existing temperature-unit v-btn-toggle exactly (computed options array + narrowing onChange handler + v-card block)"
key_files:
  created: []
  modified:
    - src/pages/SettingsPage.vue
    - src/i18n/messages/en.ts
    - src/i18n/messages/ja.ts
    - src/__tests__/settingsPage.spec.ts
decisions:
  - "Wind-unit toggle placed directly after the temperature-unit card, before the theme card, matching the plan's specified ordering"
  - "Unit symbols (km/h, mph) kept identical across en/ja locales, consistent with how °C/°F already read the same conceptually"
metrics:
  duration: "~6min"
  completed: "2026-07-09"
---

# Phase 07 Plan 07: Wind-speed-unit Settings toggle Summary

Added the wind-speed-unit toggle to SettingsPage.vue, wiring the last piece of WTHR-05 - a user-facing `v-btn-toggle` control bound to the preferences store's `windUnit`, plus matching `settings.windUnitSection` / `settings.kmh` / `settings.mph` i18n keys in en.ts and ja.ts.

## What Was Built

- **`src/pages/SettingsPage.vue`**: imported `WindUnit` alongside the existing preference types; destructured `windUnit` from `storeToRefs(store)`; added a `windUnitOptions` computed (`kmh`/`mph` options with `t()` labels) and an `onWindUnitChange(value: unknown)` handler that narrows the value to `'kmh' | 'mph'` before calling `store.setWindUnit`, mirroring the existing `onUnitChange` pattern exactly. Added a new `<v-card>` block (title + `v-btn-toggle` with `data-testid="wind-unit-toggle"`) directly after the temperature-unit card and before the theme card.
- **`src/i18n/messages/en.ts` / `ja.ts`**: added `settings.windUnitSection`, `settings.kmh`, `settings.mph` to both catalogues, keeping key-shape parity.
- **`src/__tests__/settingsPage.spec.ts`**: extended the "renders the unit, theme, and language controls" test to assert the wind-unit-toggle exists; added a new test "changing the wind-unit control updates the preferences store" that clicks the mph button and asserts `store.windUnit` becomes `'mph'`.

This completes WTHR-05 end to end: the wind-unit preference is switchable in Settings, persists to localStorage (via the store's existing `useLocalStorage` wiring from Plan 07-03), and already applies wherever wind speed is displayed (WeatherCard/CityDetailPage, wired in Plan 07-05).

## Task Execution (TDD)

**Task 1: Add wind-unit toggle to SettingsPage + i18n keys**

- RED: extended/added the two tests above; ran `npx vitest run src/__tests__/settingsPage.spec.ts` and confirmed both failed as expected (toggle not found / empty DOMWrapper). Commit: `aa96553`.
- GREEN: implemented the i18n keys and the SettingsPage control described above; re-ran the same test file plus `i18nParity.spec.ts` - both passed (6/6); ran `npm run build` - succeeded. Commit: `b619ee8`.
- REFACTOR: none needed - implementation mirrored the existing pattern exactly, no cleanup required.

## Verification

- `npx vitest run src/__tests__/settingsPage.spec.ts src/__tests__/i18nParity.spec.ts` -> PASS (6/6)
- `npm run build` -> succeeded (vue-tsc + vite build, no errors; two pre-existing `INVALID_ANNOTATION` warnings from `@vueuse/core`'s bundled `/* #__PURE__ */` comment are unrelated to this task, out of scope)
- Full suite: `npx vitest run` -> PASS (54/54)
- `git status --short` -> clean after both commits

## TDD Gate Compliance

- RED commit: `aa96553 test(07-07): add failing wind-unit-toggle test for SettingsPage`
- GREEN commit: `b619ee8 feat(07-07): add wind-unit toggle to SettingsPage (WTHR-05)`
- Gate sequence confirmed via `git log --oneline`: test commit precedes feat commit. No REFACTOR commit was needed.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None - the plan's own threat model (T-07-SETTINGS: `onWindUnitChange` value-narrowing) was implemented exactly as specified; no new surface introduced beyond what the plan already covers.

## Self-Check: PASSED

- FOUND: src/pages/SettingsPage.vue
- FOUND: src/i18n/messages/en.ts
- FOUND: src/i18n/messages/ja.ts
- FOUND: src/__tests__/settingsPage.spec.ts
- FOUND commit: aa96553
- FOUND commit: b619ee8
