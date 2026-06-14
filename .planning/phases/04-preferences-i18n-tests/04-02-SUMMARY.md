---
phase: 04-preferences-i18n-tests
plan: 02
subsystem: theming
tags: [vuetify, theme, pinia, vueuse, composable, dark-mode]
requires:
  - usePreferencesStore (theme getter + setTheme, persisted) - from 04-01
  - ThemeMode union + THEME_MODES (single source of allowed values) - from 04-01
  - Vuetify 4.1.1 (createVuetify, useTheme)
provides:
  - light + dark Vuetify themes registered (keys = ThemeMode)
  - useThemePreference composable (store theme <-> Vuetify active theme, apply-on-setup + watch)
  - Settings Theme control (Dark mode switch bound to setTheme)
  - app-bar theme quick-toggle icon button
affects:
  - 04-03 (i18n slice; shares Settings page + AppShell chrome, independent of theme)
tech-stack:
  added: []
  patterns:
    - "one composable owns the store<->Vuetify theme binding, mounted once at app root"
    - "preference enum keys equal Vuetify theme names so the value maps 1:1 with no translation"
    - "apply-on-setup + watch immediate to avoid a flash of the wrong theme on reload"
key-files:
  created:
    - src/composables/useThemePreference.ts
  modified:
    - src/plugins/vuetify.ts
    - src/App.vue
    - src/pages/SettingsPage.vue
    - src/layouts/AppShell.vue
    - implementation-notes.md
decisions:
  - "use Vuetify 4's theme.change(name) action (verified in 4.1.1 ThemeInstance) over mutating theme.global.name directly"
  - "minimal built-in light/dark palettes ({ dark: false/true }) - readability over custom design"
  - "app-bar quick toggle placed outside the nav drawer list so navigation spec's three-item expectation holds"
metrics:
  duration: "~6 min"
  completed: "2026-06-14"
  tasks: 2
  files: 6
---

# Phase 4 Plan 02: Theme slice Summary

A registered light + dark Vuetify theme bound to the persisted preferences-store `theme`
value via a single `useThemePreference` composable, plus a Settings "Dark mode" switch and an
app-bar quick-toggle - so flipping the theme switches the whole UI live and the choice
survives a reload with no flash of the wrong theme.

## What was built

- **`src/plugins/vuetify.ts`** (modified) - the `theme` config now registers a `themes` map
  with `light` ({ dark: false }) and `dark` ({ dark: true }) entries; keys are exactly the
  `ThemeMode` values so a persisted preference maps 1:1 to a registered theme. mdi icon set
  retained; `defaultTheme: 'light'` kept as a static fallback (the real initial theme is
  applied at runtime, so the plugin module never reads Pinia/localStorage).
- **`src/composables/useThemePreference.ts`** (created) - exports `useThemePreference()`, the
  one place the store theme and Vuetify's active theme are kept in sync. It reads
  `usePreferencesStore()` + Vuetify `useTheme()`, applies the persisted theme on setup
  (`theme.change(theme.value)`), and `watch`es the store `theme` (`immediate: true`) to push
  later `setTheme(...)` changes into Vuetify. Also returns a `toggleTheme()` convenience helper.
- **`src/App.vue`** (modified) - calls `useThemePreference()` exactly once in `<script setup>`
  so the binding is app-wide and route-independent. Still renders `<AppShell />`.
- **`src/pages/SettingsPage.vue`** (modified) - the Theme section now renders a `v-switch`
  ("Dark mode") bound via a `computed` get/set mapping boolean <-> `'dark'`/`'light'` through
  `setTheme`. The 04-01 unit control and the 04-03 Language placeholder are untouched.
- **`src/layouts/AppShell.vue`** (modified) - an app-bar `v-btn` icon button
  (`mdi-weather-night`/`mdi-weather-sunny`, reactive to the store theme) with
  `aria-label="Toggle dark mode"`, placed next to the title and OUTSIDE the navigation drawer
  list. It flips the store theme directly.
- **`implementation-notes.md`** (modified) - added a "Phase 4 / 04-02 (Theme slice)" section
  recording the 1:1 key mapping, the single-composable sync mounted in App.vue, the chosen
  `theme.change()` API, the no-flash-on-reload approach, and the app-bar toggle.

## Verification results

- `npm run lint` - pass (no output, exit 0).
- `npx vue-tsc --noEmit -p tsconfig.app.json` - pass (no output, exit 0, strict mode).
- `npm test` (full suite) - **6 files / 20 tests passed**: navigation, cityDetail,
  cities-store, preferences-store, useTemperature, sample. No regressions; the drawer still
  has exactly three items (navigation spec passes unchanged, app-bar button is outside `.v-list`).
- Greps confirm: `dark` theme key in `src/plugins/vuetify.ts`; `useTheme` in
  `src/composables/useThemePreference.ts`; `useThemePreference` called in `src/App.vue`;
  `setTheme` in `src/pages/SettingsPage.vue`. No `v-html` in any `src` file.

The only runtime notice is jsdom's "HTMLCanvasElement getContext() not implemented" for the
Chart.js component test - pre-existing and benign; the test still passes.

## Deviations from Plan

None - both auto tasks were executed exactly as written. No new dependency added.

## Threat surface

No new surface beyond the plan's `<threat_model>`. The binding only passes the store's
already-sanitized `'light'`/`'dark'` value to Vuetify (T-04-05 mitigated upstream in 04-01);
controls render only static labels with no `v-html` (T-04-06 mitigated).

## Checkpoint: PENDING (blocking human-verify)

Task 3 is a `checkpoint:human-verify` with `gate="blocking"`. Both auto tasks are committed
and all automated gates are green, but the plan is NOT fully done until a human verifies the
live behavior in the dev server. The orchestrator should relay the steps below to the user.

**How to verify (run `npm run dev`):**
1. Add a city or two on the dashboard so cards are visible.
2. Go to Settings - confirm a "Temperature unit" control and a "Theme" (Dark mode) control show.
3. Switch the unit (Celsius <-> Fahrenheit) - every temperature on cards AND a city detail
   page (list + chart axis/labels) updates live.
4. Toggle the theme to Dark - the WHOLE app (app bar, drawer, cards, pages) switches instantly;
   toggle back to Light.
5. Use the app-bar quick-toggle icon - it also flips the theme.
6. Reload (F5) - BOTH the chosen unit AND theme are still applied, no flash of the wrong theme,
   saved cities still there.
7. No console errors throughout.

**Resume signal:** the user types "approved", or describes any issue (theme not switching
everywhere, theme/unit lost on reload, flash of wrong theme, console error, broken nav).

## Commits

- `acb9a0f` feat(04-02): register dark theme and bind Vuetify to persisted theme preference
- `8f81067` feat(04-02): add Settings theme switch and app-bar quick-toggle

## Self-Check: PASSED

- Files created exist: src/composables/useThemePreference.ts - FOUND.
- Files modified exist: src/plugins/vuetify.ts, src/App.vue, src/pages/SettingsPage.vue,
  src/layouts/AppShell.vue, implementation-notes.md - all FOUND.
- Commits exist: acb9a0f, 8f81067 - both FOUND in git log.
