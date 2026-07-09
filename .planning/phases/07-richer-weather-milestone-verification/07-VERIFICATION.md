---
phase: 07-richer-weather-milestone-verification
verified: 2026-07-09T00:00:00Z
status: human_needed
score: 5/5 roadmap truths verified (automated); 5 items require human sign-off
overrides_applied: 0
human_verification:
  - test: "Click 'Use my location' on the dashboard in a real browser and grant/deny the permission prompt"
    expected: "Granting adds a 'My Location' card; denying/unavailable/unsupported shows the matching i18n alert text; button and alert render correctly in both light/dark theme and en/ja locale"
    why_human: "Real browser permission-prompt UX and visual rendering across theme/locale cannot be exercised by jsdom unit tests or the current Playwright smoke test (smoke test's scope never touches geolocation, per Plan 07-08's own threat model note T-07-PERM)"
  - test: "Drag two saved city cards to reorder them, then perform an actual full page reload (F5) and confirm the new order is still shown"
    expected: "Card order after reload matches the order set by the drag gesture"
    why_human: "Automated coverage (cities.store.spec.ts, dashboardPage.spec.ts) proves reorderCities() persists to localStorage and that the grid re-renders reactively on a store mutation, but no test performs a real browser navigation/reload to confirm the persisted value is picked up on next mount - this is the literal wording of roadmap Success Criterion 2 ('the order survives a page reload')"
  - test: "Visually inspect the new richer-conditions fields (feels-like, precipitation, UV index, sunrise/sunset), the last-updated/refresh row, and the drag handle affordance on WeatherCard and CityDetailPage in both light and dark theme and both en/ja locales"
    expected: "All new fields/icons/spacing look correct and readable in every theme/locale combination; the refresh button's spinner icon actually animates while a refetch is in flight"
    why_human: "Visual layout, icon rendering, and CSS animation cannot be verified by grep or jsdom - explicitly deferred to end-of-phase per Plan 07-05's <verification> section"
  - test: "Visually inspect the new wind-speed-unit toggle on the Settings page in both light/dark theme and both en/ja locales"
    expected: "Toggle renders correctly, matches the temperature-unit toggle's visual style, and both labels read naturally in Japanese"
    why_human: "Visual/i18n rendering quality - explicitly deferred to end-of-phase per Plan 07-07's <verification> section"
  - test: "Review the 4 open WARNING-level findings in 07-REVIEW.md (WR-01 route-id/id:0 collision, WR-02 silently-swallowed hourly fetch errors, WR-03 unguarded sunrise/sunset array access, WR-04 buttons nested inside the card's anchor / invalid HTML) and decide whether to fix now or accept as tracked debt"
    expected: "A developer decision: fix before shipping v1.1, or explicitly accept via a VERIFICATION.md override / follow-up issue"
    why_human: "These are code-quality/robustness judgment calls (none currently breaks a phase must-have under normal usage, confirmed by re-reading the affected files), not something an automated gate can decide"
---

# Phase 07: Richer Weather & Milestone Verification - Verification Report

**Phase Goal:** The dashboard gains the next layer of real-app features - geolocation, reorderable cities, richer current conditions, wind unit preference, and manual refresh - and the whole core flow is verified end to end with Playwright.
**Verified:** 2026-07-09
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria - the contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can add their current location as a saved city via "use my location", with a clear denied/unavailable/unsupported message | VERIFIED | `src/composables/useMyLocation.ts` (one-shot fix, `pause()` on first result, `errorKind` mapping) + `src/components/GeolocationButton.vue` (button + `v-alert`) wired into `DashboardPage.vue:24`; `geo.*` i18n keys present in `en.ts`/`ja.ts` with parity (`i18nParity.spec.ts` passes); `useMyLocation.spec.ts` covers success/denied/unavailable/unsupported (4/4 pass in full suite run) |
| 2 | User can reorder saved city cards by drag-and-drop, and the order survives a page reload | VERIFIED (persistence mechanism) / human check needed for literal reload | `src/stores/cities.ts:69-71` `reorderCities()` reassigns the `useLocalStorage`-backed `cities` ref (`flush: 'sync'`), the same mechanism `addCity`/`removeCity` already use; `DashboardPage.vue:39-52` wraps the grid in `<draggable>` bound via `item-key="key"` and `@update:model-value="store.reorderCities"`; `cities.store.spec.ts` proves the localStorage entry updates immediately; `dashboardPage.spec.ts` proves the grid re-renders in the new order. No test performs an actual browser reload to confirm read-back - flagged as human verification item 2 |
| 3 | Cards/detail show richer current conditions: feels-like, precipitation, UV index, sunrise/sunset | VERIFIED | `src/lib/openMeteo.ts:70-97` fetches `apparent_temperature,precipitation,uv_index` (current) + `sunrise,sunset` (daily) in ONE `http.get`; `CurrentWeather` type (`src/types/weather.ts`) carries all 5 new fields; `WeatherCard.vue:134-144` and `CityDetailPage.vue:167-179` both render feelsLike/precipitation/uvIndex/sunrise/sunset via i18n-keyed strings; `openMeteo.spec.ts`, `weatherCard.spec.ts`, `cityDetail.spec.ts` all pass |
| 4 | User can switch wind speed unit (km/h/mph), it persists and applies wherever wind is shown; each card shows last-updated + manual refresh | VERIFIED | `src/composables/useWindSpeed.ts` mirrors `useTemperature`'s `{unit, unitSymbol, convert, format}` contract; `src/stores/preferences.ts` has `windUnit`/`setWindUnit` with sanitize fallback to `kmh`; `SettingsPage.vue:93-109` `data-testid="wind-unit-toggle"` wired to `store.setWindUnit`; `WeatherCard.vue:127`/`CityDetailPage.vue:183` both render wind via `formatWind()`; both surfaces show `card.lastUpdated`/refresh button driven by Vue Query's `dataUpdatedAt`/`isRefetching`/`refetch()`; `weatherCard.spec.ts`'s "refetches current weather when the refresh button is clicked" test passes |
| 5 | Playwright e2e smoke flow passes: search a city -> card appears -> open detail -> forecast list + chart render | VERIFIED (ran live, not just SUMMARY claim) | `npx playwright test` executed directly by this verifier: **1 passed (14.3s)** against the real `npm run dev` server and the real Open-Meteo API. `playwright.config.ts` (webServer + chromium project), `e2e/smoke.spec.ts` (search->card->detail->forecast-list+forecast-chart+hourly-chart), `CitySearch.vue` `data-testid="city-search"` all present and correct |

**Score:** 5/5 roadmap truths hold under automated + live verification. Truth 2's "survives a page reload" clause is mechanism-verified but not literally reload-tested -> human item.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | `vuedraggable@^4.1.0` (deps), `@playwright/test@^1.61.1` (devDeps) | VERIFIED | Confirmed via `node -e` inspection - correct versions, correct dependency buckets |
| `src/lib/openMeteo.ts` | Extended `fetchCurrentWeather` + `ForecastResponse` (current+daily, one call) | VERIFIED | One `http.get` call site; params include `apparent_temperature,precipitation,uv_index` + `daily: 'sunrise,sunset'` |
| `src/types/weather.ts` | `CurrentWeather` with `uvIndex` etc. | VERIFIED | 9 fields present: temperature, weatherCode, windSpeed, humidity, feelsLike, precipitation, uvIndex, sunrise, sunset |
| `src/types/preferences.ts` / `src/stores/preferences.ts` | `WindUnit` + `windUnit`/`setWindUnit` + sanitize branch | VERIFIED | `WIND_UNITS = ['kmh','mph']`, sanitize falls back to `DEFAULT_PREFERENCES.windUnit` |
| `src/composables/useWindSpeed.ts` | `kmhToMph` + `useWindSpeed()` mirroring `useTemperature` | VERIFIED | Exact `{unit, unitSymbol, convert, format}` shape |
| `src/composables/useMyLocation.ts` | one-shot fix + store wiring | VERIFIED | `pause()` called on first finite coords or error; `store.addCity({id:0, name:'My Location', ...})` on success |
| `src/components/GeolocationButton.vue` | button + alert, `data-testid="geo-button"` | VERIFIED | present, i18n-keyed, no hard-coded strings |
| `src/pages/CityDetailPage.vue` | `data-testid="current-conditions"` panel | VERIFIED | panel present inside the `v-else-if="forecast"` branch with its own loading/error/content sub-states |
| `src/components/WeatherCard.vue` | richer fields + wind unit + last-updated/refresh + route-by-key + `data-testid="weather-card"` | VERIFIED (with residual review debt, see Anti-Patterns) | `:to` uses `params: { id: city.key }` (not `city.id`); refresh button wired to `refetch()` |
| `src/stores/cities.ts` | `reorderCities(newOrder)` | VERIFIED | one-line whole-array reassignment, matches `addCity`/`removeCity` style |
| `src/pages/DashboardPage.vue` | `<draggable>` grid + `<GeolocationButton>` | VERIFIED | both present and wired |
| `src/pages/SettingsPage.vue` | `data-testid="wind-unit-toggle"` | VERIFIED | mirrors the existing unit toggle exactly |
| `playwright.config.ts` / `tsconfig.e2e.json` / `e2e/smoke.spec.ts` | e2e infra, isolated from `npm run build` scope | VERIFIED | `tsconfig.json`'s `references` array only lists `app`/`node` (not `e2e`); `npm run build` succeeds; `npx playwright test` passes live |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `WeatherCard.vue` | `city-detail` route | `:to="{ params: { id: city.key } }"` | WIRED | Confirmed `city.key`, not `String(city.id)`; regression test proves two `id:0` cities get distinct hrefs |
| `CityDetailPage.vue` | `useCurrentWeather(city)` | direct call | WIRED | Same resolved `city` computed reused across forecast/hourly/current calls (DATA-04 discipline maintained) |
| `useWindSpeed.ts` | `preferences.ts` | `prefs.windUnit` computed read | WIRED | `computed(() => prefs.windUnit)` |
| `DashboardPage.vue` | `cities.ts` | `@update:model-value="store.reorderCities"` | WIRED | Confirmed in template; `dashboardPage.spec.ts` proves reactive re-render |
| `DashboardPage.vue` | `GeolocationButton.vue` | `<GeolocationButton class="mb-4" />` | WIRED | Present between `CitySearch` and the city grid |
| `e2e/smoke.spec.ts` | `src/App.vue` via Vite dev server | `playwright.config.ts` `webServer` | WIRED (live-verified) | `npx playwright test` run by this verifier passed against the real dev server |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `WeatherCard.vue` / `CityDetailPage.vue` | `data`/`current` (feelsLike, precipitation, uvIndex, sunrise, sunset) | `useCurrentWeather(city)` -> `fetchCurrentWeather` -> live Open-Meteo `/v1/forecast` (verified by the live Playwright run, not just mocks) | Yes | FLOWING |
| `DashboardPage.vue` grid | `cities` (order) | `useCitiesStore().cities` (`useLocalStorage`-backed) | Yes | FLOWING |
| `SettingsPage.vue` wind toggle | `windUnit` | `usePreferencesStore().windUnit` | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full unit/component suite stays green | `npx vitest run` | `PASS (54) FAIL (0)` | PASS |
| Production build succeeds, e2e scope excluded | `npm run build` | Succeeded (17.5s), only pre-existing unrelated `@vueuse/core` `INVALID_ANNOTATION` cosmetic warnings | PASS |
| i18n en/ja key parity holds | `npx vitest run src/__tests__/i18nParity.spec.ts` | `PASS (1) FAIL (0)` | PASS |

### Probe Execution

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| Playwright milestone smoke test | `npx playwright test` (run live by this verifier, not sourced from SUMMARY claims) | `1 passed (14.3s)` against real `npm run dev` + real Open-Meteo API | PASS |

This directly confirms the vite `^8.0.16` -> `^7.3.6` downgrade (commit `29adfb2`, deviation from Plan 07-08) holds: the app mounts correctly in a real Chromium browser via `npm run dev`, and the full search -> card -> detail -> forecast/chart flow completes.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|--------------|--------|----------|
| GEO-01 | 07-04, 07-06 | Use-my-location saved city with denied/unavailable state | SATISFIED | `useMyLocation.ts`, `GeolocationButton.vue`, wired into `DashboardPage.vue`; note: REQUIREMENTS.md's parenthetical "(Open-Meteo reverse geocoding)" was superseded by a research-confirmed constraint (no such Open-Meteo endpoint exists) and a user-approved static "My Location" label instead - functionally satisfies the requirement's user-facing intent, but the REQUIREMENTS.md wording itself was never updated to match (informational, not blocking) |
| STATE-04 | 07-01, 07-06 | Drag-and-drop reorder, persists across reload | SATISFIED (mechanism) / human check for literal reload, see human_verification |
| WTHR-04 | 07-02, 07-05 | Richer current conditions on cards/detail | SATISFIED | verified above |
| WTHR-05 | 07-03, 07-05, 07-07 | Switchable, persisted wind unit applied wherever wind is shown | SATISFIED | verified above, full chain (store -> composable -> WeatherCard -> CityDetailPage -> Settings toggle) confirmed |
| DATA-06 | 07-05 | Last-updated + manual refresh | SATISFIED | verified above |
| TEST-06 | 07-01, 07-08 | Playwright e2e smoke flow passes | SATISFIED | Live-run confirmed by this verifier, not just SUMMARY claim |

No orphaned requirements: REQUIREMENTS.md's Phase 7 traceability row lists exactly these 6 IDs, all six appear in at least one plan's `requirements:` frontmatter, and all six are marked `[x]` in the milestone requirements checklist.

### Anti-Patterns Found

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` debt markers found in any file this phase modified (re-scanned directly, not sourced from SUMMARY claims).

The following 4 findings from `07-REVIEW.md` (dated the same day, HEAD commit `2a1e6a3` is the review itself - no fix commit follows it) were independently re-confirmed present in the current codebase by this verifier:

| File | Line(s) | Pattern | Severity | Impact |
|------|---------|---------|----------|--------|
| `src/pages/CityDetailPage.vue` | 27-30 (WR-01) | `store.cities.find((c) => String(c.id) === id \|\| c.key === id)` - the `String(c.id) === id` branch can match the wrong geolocation city (`id:0`) if a route param is the literal string `"0"` | WARNING | Not reachable via the app's own generated links (`WeatherCard`/`draggable` route by `city.key`), only via a manually typed/bookmarked `/city/0` URL. Does not break the phase's own must-have (verified WeatherCard generates distinct hrefs per geolocation city), but is unfixed latent debt in the lookup itself |
| `src/pages/CityDetailPage.vue` | 55, 211 (WR-02) | `const { data: hourly } = useHourlyForecast(city)` has no `isPending`/`isError` branch - a failed hourly fetch silently renders nothing, no error/spinner shown | WARNING | Pre-existing pattern from Phase 6 (hourly chart), not newly introduced by Phase 7, but adjacent to this phase's current-conditions panel work and still unfixed |
| `src/lib/openMeteo.ts` | 95-96 (WR-03) | `daily.sunrise[0]` / `daily.sunset[0]` unguarded - would produce "Invalid Date" text if Open-Meteo ever returns an empty array (polar day/night edge case) | WARNING | Low likelihood under normal test-city usage (London/Tokyo, etc.); not exercised by the current test suite or the live e2e run |
| `src/components/WeatherCard.vue` | 87-93, 107-111, 147-154 (WR-04) | New refresh `<v-btn>` (this phase) nested, alongside pre-existing remove/retry buttons, inside the `<v-card :to="...">` anchor - invalid HTML5 (button-inside-anchor), inconsistent screen-reader behavior | WARNING | Functionally works for mouse/keyboard (`.stop.prevent` correctly suppresses navigation), but is an a11y/HTML-validity regression introduced by this phase's new refresh button that stacks on top of two pre-existing instances of the same pattern |

None of these four findings causes any of this phase's must-have truths to fail under normal, app-generated navigation - all were independently exercised by the live Playwright run and the full 54-test unit/component suite, both green. They are carried forward as open, developer-facing debt (see Human Verification item 5) rather than treated as BLOCKER since (a) the code review itself classified them as WARNING not CRITICAL, (b) none is reachable through any path this phase's own UI generates, and (c) fixing them was out of this phase's task scope (07-REVIEW.md is dated after the phase's plan execution, as a closing quality gate).

### Human Verification Required

See YAML frontmatter `human_verification` block for the full structured list (5 items): geolocation permission-prompt UX across theme/locale, drag-order survival across an actual browser reload, visual QA of the new richer-conditions fields/last-updated/refresh row across theme/locale, visual QA of the new wind-unit Settings toggle across theme/locale, and a developer decision on the 4 open code-review WARNING findings.

### Gaps Summary

No BLOCKER-level gaps found. All 5 roadmap Success Criteria hold under automated inspection and a live `npx playwright test` run performed by this verifier (not sourced from SUMMARY claims). The vite `^7.3.6` downgrade deviation (commit `29adfb2`) was independently confirmed to hold: `npm run dev` + a real Chromium browser correctly mounts the app and completes the full search->card->detail->forecast/chart flow.

Status is `human_needed` rather than `passed` because five items genuinely require human judgment/a real browser that automated tooling in this environment cannot substitute for: (1) the real geolocation permission-prompt flow and its visual rendering, (2) an actual page-reload confirming drag-order persistence (the literal wording of roadmap Success Criterion 2), (3)-(4) visual QA of new UI across theme/locale combinations, and (5) a developer decision on 4 open, non-blocking code-review WARNING findings that remain unfixed as of the HEAD commit.

---

_Verified: 2026-07-09_
_Verifier: Claude (gsd-verifier)_
