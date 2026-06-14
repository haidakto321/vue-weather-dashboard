---
phase: 04-preferences-i18n-tests
plan: 03
subsystem: i18n-localization
tags: [vue-i18n, i18n, pinia, vueuse, composable, vitest, settings, localization]
requires:
  - usePreferencesStore (language getter + setLanguage, persisted, sanitized) - from 04-01
  - Language union + LANGUAGES (single source of allowed values) - from 04-01
  - useThemePreference pattern to mirror (apply-on-setup + watch, mounted once in App.vue) - from 04-02
  - vue-i18n@9 (installed in 04-01)
provides:
  - i18n instance (createI18n, legacy:false, en/ja, fallbackLocale en)
  - en + ja message catalogues in key parity (31 keys each)
  - useLanguagePreference composable (store language <-> vue-i18n active locale)
  - Settings language switcher (en/ja, bound to setLanguage)
  - all chrome/page/component strings i18n-keyed
  - SettingsPage component test (TEST-03)
affects:
  - closes Phase 4 (i18n slice + the third required test); phase ready for whole-phase human-verify
tech-stack:
  added: []
  patterns:
    - "one composable owns the store<->vue-i18n locale binding, mounted once at app root"
    - "preference enum keys equal i18n locale keys so the value maps 1:1 with no translation"
    - "initial locale read from sanitized raw localStorage to avoid Pinia-before-i18n bootstrap"
    - "en/ja kept in strict key parity; fallbackLocale degrades a missing key to English"
key-files:
  created:
    - src/i18n/index.ts
    - src/i18n/messages/en.ts
    - src/i18n/messages/ja.ts
    - src/composables/useLanguagePreference.ts
    - src/__tests__/settingsPage.spec.ts
  modified:
    - src/main.ts
    - src/App.vue
    - src/pages/SettingsPage.vue
    - src/layouts/AppShell.vue
    - src/pages/DashboardPage.vue
    - src/pages/CityDetailPage.vue
    - src/components/WeatherCard.vue
    - src/components/ForecastList.vue
    - src/components/CitySearch.vue
    - src/__tests__/navigation.spec.ts
    - src/__tests__/cityDetail.spec.ts
    - implementation-notes.md
decisions:
  - "WMO condition labels stay English-only in wmo.ts; chrome/pages are the translation scope"
  - "initial locale read from raw sanitized 'weather-prefs' localStorage (approach a) to avoid a Pinia-before-i18n bootstrap problem and avoid a flash of the wrong language on reload"
  - "vue-i18n legacy:false (Composition API) so <script setup> can use useI18n()/t()"
  - "CitySearch label/placeholder translated; vee-validate error copy deferred (out of slice scope)"
  - "ForecastList date locale follows the active language (en->en-GB, ja->ja-JP)"
metrics:
  duration: "~12 min"
  completed: "2026-06-14"
  tasks: 3
  files: 17
---

# Phase 4 Plan 03: i18n slice + Settings component test Summary

vue-i18n configured with complete English + Japanese catalogues (31 keys, strict parity), its
active locale bound to the persisted `language` preference via a single `useLanguagePreference`
composable, a Settings en/ja language switcher, every chrome/page/component string replaced by
i18n keys, and the required SettingsPage component test - so a user picks English or Japanese in
Settings and all UI text updates live and survives a reload. This is the final plan of Phase 4.

## What was built

- **`src/i18n/messages/en.ts` / `ja.ts`** (created) - two `export default` catalogues with the
  EXACT same nested key shape (groups: `nav`, `app`, `dashboard`, `search`, `card`, `detail`,
  `settings`). 31 keys each; verified parity (no missing/extra keys). WMO condition labels are
  intentionally left English-only in `wmo.ts`.
- **`src/i18n/index.ts`** (created) - exports `i18n` from
  `createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en, ja } })`. The
  initial `locale` is read from the raw, sanitized `'weather-prefs'` localStorage value
  (validated against `LANGUAGES`, default fallback) so the correct locale is active at first
  paint without a Pinia-before-i18n bootstrap problem (threat T-04-07). `fallbackLocale: 'en'`
  degrades any missing key to English (T-04-09).
- **`src/composables/useLanguagePreference.ts`** (created) - mirrors `useThemePreference` from
  04-02: reads `usePreferencesStore()` + vue-i18n's `useI18n()` `locale`, applies the persisted
  `language` on setup, and `watch`es the store language (immediate) to push later
  `setLanguage(...)` changes into the active locale live.
- **`src/main.ts`** (modified) - registers `.use(i18n)` after pinia/VueQuery and before
  `.mount('#app')`.
- **`src/App.vue`** (modified) - calls `useLanguagePreference()` once at the app root, alongside
  the existing `useThemePreference()`, so the locale sync is app-wide and route-independent.
- **`src/pages/SettingsPage.vue`** (modified) - the Language section is now a `v-btn-toggle` over
  `en`/`ja` (labels "English" / "日本語") bound to `setLanguage`; all SettingsPage labels use
  `t('settings...')`. Added `data-testid` hooks (`unit-toggle`, `theme-switch`,
  `language-toggle`) for the component test.
- **`AppShell.vue`** (modified) - nav titles (computed so they re-translate live), app-bar title,
  and the nav/theme aria-labels via `t()`. Exactly three drawer items retained.
- **`DashboardPage.vue` / `CityDetailPage.vue` / `WeatherCard.vue` / `CitySearch.vue`**
  (modified) - all user-visible strings via `t()`; card aria-labels and wind/humidity use i18n
  interpolation (`{city}`, `{value}`). No `v-html` introduced.
- **`ForecastList.vue`** (modified) - the date label locale now follows the active language
  (`en` -> `en-GB`, `ja` -> `ja-JP`); the formatted label is computed inside the reactive `days`
  so it re-renders on a live language switch.
- **`src/__tests__/settingsPage.spec.ts`** (created) - the required component test (TEST-03):
  mounts SettingsPage with Vuetify + Pinia + i18n; asserts the three controls render, reflect
  store defaults (celsius/light/en) on mount, and proves control->store behavior (language click
  sets `store.language='ja'` and the page text follows the locale to 設定; unit click sets
  `store.unit='fahrenheit'`).
- **`navigation.spec.ts` / `cityDetail.spec.ts`** (modified) - the real `i18n` instance added to
  `global.plugins` because App now mounts chrome that calls `t()`. Assertions still read the
  default `'en'` messages, so no real assertion was weakened.
- **`implementation-notes.md`** (modified) - added the "Phase 4 / 04-03 (i18n slice)" section.

## Verification results

- `npm run lint` - pass (exit 0, no output).
- `npx vue-tsc --noEmit -p tsconfig.app.json` - pass (exit 0, strict mode).
- `npx vitest run src/__tests__/settingsPage.spec.ts` - pass (1 file / 4 tests).
- `npm test` (full suite) - **7 files / 24 tests passed**: settingsPage (4, new),
  preferences-store (6), useTemperature (4), cities-store (4), cityDetail, navigation, sample.
  No regressions (was 20; +4 from the new spec).
- Greps confirm: `createI18n` in `src/i18n/index.ts`; `.use(i18n)` in `src/main.ts`;
  `usePreferencesStore` + `locale` in `useLanguagePreference.ts`; `useLanguagePreference` in
  `App.vue`; `setLanguage` in `SettingsPage.vue`; `t(` in AppShell/DashboardPage/CityDetailPage/
  WeatherCard. en/ja parity = 31 keys each, no missing/extra. No `v-html` in any `src` file.

The only runtime notice is jsdom's "HTMLCanvasElement getContext() not implemented" for the
Chart.js component mount - pre-existing and benign; the test still passes.

## Deviations from Plan

None affecting behavior. Two plan-sanctioned choices were made and recorded:

- **WMO labels English-only** - the plan offered "translate or keep English"; kept English-only
  in `wmo.ts` (the simpler, readable choice for a study artifact). Recorded in
  implementation-notes and en.ts.
- **vee-validate error copy deferred** - CitySearch's label/placeholder ARE translated, but the
  three validation messages are left as authored English. The plan explicitly allows deferring
  CitySearch-adjacent strings as long as the chrome+pages demonstrate live switching, which they
  do. Recorded in implementation-notes.

Minor (not behavior): added `data-testid` attributes to the three Settings controls to make the
component test query stable rather than poke deep Vuetify internals (the plan permits this).

## Threat surface

No new surface beyond the plan's `<threat_model>`. The initial locale read sanitizes the raw
localStorage value against `LANGUAGES` with a fallback (T-04-07); `fallbackLocale: 'en'` keeps a
missing key from breaking render (T-04-09); all translated strings (including the interpolated
city name) render via `{{ }}` / bound props with no `v-html` (T-04-08).

## Known Stubs

None. The 04-01 Language placeholder in SettingsPage is now fully replaced by the working en/ja
switcher; no remaining placeholder/coming-soon text in the touched files.

## Checkpoint: APPROVED (blocking whole-phase human-verify)

Task 4 `checkpoint:human-verify` (gate="blocking") - the whole-phase end-to-end gate - was relayed
to the user, who ran the dev server and replied "approved" on 2026-06-14. Phase 4 is complete and
milestone v1 is code-complete. The three code tasks were committed and all automated checks passed;
the steps the user verified in the browser:

1. `npm run dev`. Add two cities (e.g. London, Tokyo) so cards and a detail page have content.
2. In Settings, confirm three controls: Temperature unit, Theme, and Language.
3. Switch Language to 日本語 - confirm the app-bar title, nav drawer items, Dashboard
   heading/empty state, Settings labels, City Detail headings/buttons, and card error/aria text
   all switch to Japanese live, with NO reload. Switch back to English - confirm it reverts.
4. Switch the temperature unit (C <-> F) - all temperatures (cards + detail list + chart) update
   live.
5. Toggle Theme (light/dark) - the whole UI switches live.
6. Reload (F5). Confirm language, theme, unit, AND saved cities all persist exactly as set, with
   no flash of the wrong theme/locale.
7. Run `npm test` - confirm all tests pass (preferences store, useTemperature, SettingsPage).
8. Confirm no console errors (including no vue-i18n "missing key" warnings).

**Resume signal:** Type "approved", or describe any issue (untranslated text, missing-key
warning, preference lost on reload, control not updating the UI, failing test, console error).

## Commits

- `dc606b4` feat(04-03): configure vue-i18n en/ja and bind locale to persisted preference
- `a43ce47` feat(04-03): i18n-key all chrome/page/component strings and add language switcher
- `30e1028` test(04-03): add SettingsPage component test (TEST-03)

## Self-Check: PASSED

- Files created exist: src/i18n/index.ts, src/i18n/messages/en.ts, src/i18n/messages/ja.ts,
  src/composables/useLanguagePreference.ts, src/__tests__/settingsPage.spec.ts - all FOUND.
- Commits exist: dc606b4, a43ce47, 30e1028 - all FOUND in git log.
