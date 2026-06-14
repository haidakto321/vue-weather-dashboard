# Implementation Notes - Phase 1 (Foundation & Shell)

A running log of decisions that were NOT spelled out in 01-PLAN.md, plus tradeoffs and
anything the user should know. Plan-prescribed work is not repeated here.

## Task 1 - Scaffold + RED navigation test

### Scaffolding method (not `npm create vite`)
- The plan suggested `npm create vite@latest . -- --template vue-ts` then reconcile.
- I instead authored the scaffold files by hand (package.json, configs, src/*) and ran a
  single `npm install`. Reason: full control over exact versions, no leftover template
  cruft (HelloWorld.vue, demo CSS, logo assets) to delete, and a smaller readable tree -
  which fits the "readability over cleverness, study artifact" project rule. The resulting
  project is functionally identical to a `vue-ts` Vite scaffold.

### Exact versions installed (verified on the npm registry 2026-06-11, Node 22.14 / npm 10.9)
- runtime: vue 3.5.38, vue-router 5.1.0, vuetify 4.1.1, @mdi/font 7.4.47
- dev: vite 8.0.16, @vitejs/plugin-vue 6.0.7, vite-plugin-vuetify 2.1.3,
  typescript 6.0.3, vue-tsc 3.3.4, eslint 10.4.1, eslint-plugin-vue 10.9.2,
  @vue/eslint-config-typescript 14.8.0, @vue/eslint-config-prettier 10.2.0,
  prettier 3.8.4, vitest 4.1.8, @vue/test-utils 2.4.11, jsdom 29.1.1
- All match the plan's agreed caret/tilde ranges. No package outside the agreed set.

### ESLint config format: flat config (eslint.config.ts)
- ESLint 10 defaults to flat config and legacy `.eslintrc.cjs` is effectively removed in
  v10. The plan's `files_modified` list names `.eslintrc.cjs`, but that format is no longer
  supported by ESLint 10. DECISION: use a flat `eslint.config.ts` instead. This is a
  format substitution forced by the pinned ESLint major version, not a scope change - the
  lint gate (SETUP-02) still works exactly as required.
- @vue/eslint-config-typescript and @vue/eslint-config-prettier both ship flat-config
  presets, so Prettier and ESLint coexist without rule conflicts (prettier preset is placed
  last so it disables formatting-related lint rules).

### Route component import style
- Pages are imported eagerly (static `import`) in src/router/index.ts rather than lazy
  `() => import(...)`. Reason: only three tiny placeholder pages and eager imports read
  more simply for a beginner. Lazy loading can be introduced in a later phase if the bundle
  grows.

### Page markers (for the navigation test to assert)
- Each page renders a unique heading string: "Dashboard", "City Detail", "Settings".
  The navigation test asserts on these strings. Kept deliberately plain - real content
  arrives in later phases.

### TypeScript config
- Used the standard Vite vue-ts solution-style split. The plan's files list names
  `tsconfig.json` and `tsconfig.node.json`. The current Vite vue-ts template actually
  uses THREE files: a thin solution `tsconfig.json` that only references the others,
  `tsconfig.app.json` (the real app compiler options + path alias), and
  `tsconfig.node.json` (vite/vitest config tooling). DECISION: I kept that 3-file layout
  because `vue-tsc --build` expects it and it is the idiomatic modern setup. The extra
  `tsconfig.app.json` is the only file beyond the plan's named list, and it is purely the
  app half of the tsconfig the plan already asked for.
- `verbatimModuleSyntax` is on (Vite default), so type-only imports use `import type`.

### Test harness notes (jsdom shims)
- jsdom does not implement `ResizeObserver` or a useful `matchMedia`, both of which
  Vuetify touches. The navigation test installs tiny no-op shims in `beforeAll` so
  Vuetify components mount cleanly under jsdom. This is test-only plumbing, not app code.
- `vitest.config.ts` inlines `vuetify` deps so its ESM/CSS imports resolve in the test
  transform.

### Task 1 RED result (expected)
- After Task 1: sample test passes; navigation test compiles and RUNS. 2 of its 4 cases
  pass (initial Dashboard render + programmatic route swap, since App renders RouterView),
  and 2 fail (active-item highlight + click a drawer link) because AppShell + the drawer
  do not exist yet. That is the intended RED handed to Task 2.

## Task 2 - Vuetify shell + wire navigation (GREEN)

### Drawer responsive behavior (UI-03)
- Used Vuetify's `useDisplay()` `mobile` flag. Drawer starts open on desktop, closed on
  mobile, and is `:temporary` (overlay) on mobile. No hand-written media queries - this is
  Vuetify's built-in breakpoint system, which is what UI-03 asks for.

### Active-route highlight (NAV-03)
- Relied on Vuetify's router-link integration: each `v-list-item` takes a `:to` and a
  `color="primary"`. Vuetify adds `v-list-item--active` to the item matching the current
  route automatically - no manual route comparison. The navigation test asserts on
  `.v-list-item--active` containing "Settings" when on /settings.

### City Detail link target
- The drawer's City Detail link points at a concrete sample param `{ name: 'city-detail',
  params: { id: 'tokyo' } }` so it is navigable this phase (the route requires :id). Phase 3
  will replace this with real city ids.

### Task 2 GREEN result
- navigation.spec.ts: all 4 cases pass. Shell renders, drawer links drive navigation,
  active route is highlighted.

## Task 3 - Quality gate (lint / test / build / dev)

### ESLint flat config must be .mjs, not .ts (blocking fix)
- `npm run lint` initially failed: ESLint 10 needs the `jiti` library to load a TypeScript
  (`eslint.config.ts`) flat config, and `jiti` is NOT in the agreed dependency set.
- DECISION (auto-fix, no new dep): renamed the config to `eslint.config.mjs` (plain ESM).
  The `@vue/eslint-config-*` presets are importable from ESM directly, so the config loads
  with zero extra packages. This keeps the dependency set exactly as agreed.

### Build typecheck fixes (blocking, no new deps)
- `npm run build` (vue-tsc) surfaced three blocking errors, all fixed without adding deps:
  1. `baseUrl` is deprecated in TypeScript 6. Removed `baseUrl` from tsconfig.app.json;
     the `@/*` path alias still resolves under `moduleResolution: bundler` without it.
  2. vite.config.ts / vitest.config.ts used `node:url` + `import.meta.url`, which need
     `@types/node`. `@types/node` is part of the stock Vite vue-ts scaffold but is NOT on
     this phase's agreed dependency list. DECISION: rather than add it, I replaced the
     URL-based alias with Vite's built-in root-relative alias `'@': '/src'`. Simpler,
     readable, and needs no node type definitions. The configs no longer import any node
     APIs.
- Net effect: the agreed dependency set is unchanged - no `jiti`, no `@types/node`,
  nothing beyond the Phase-1 list.

### Final working scripts (all verified)
- `npm run dev`     -> Vite dev server, ready ~340 ms, serves HTTP 200 at
                       http://localhost:5173/, no console errors (boot-checked then stopped).
- `npm run lint`    -> exits 0, no warnings/errors (SETUP-02).
- `npm test` / `npx vitest run` -> 2 files, 5 tests, all pass (sample + 4 navigation cases)
                       (SETUP-03).
- `npm run build`   -> vue-tsc typecheck clean + vite build succeeds (194 modules).
- `npm run preview` -> defined for local production preview (not exercised this phase).

### Dependency audit
- dependencies: @mdi/font, vue, vue-router, vuetify
- devDependencies: @vitejs/plugin-vue, @vue/eslint-config-prettier,
  @vue/eslint-config-typescript, @vue/test-utils, eslint, eslint-plugin-vue, jsdom,
  prettier, typescript, vite, vite-plugin-vuetify, vitest, vue-tsc
- Confirmed absent: pinia, axios, @tanstack/vue-query, vee-validate, yup, chart.js,
  vue-chartjs, vue-i18n, @vueuse/core (all later phases), plus jiti and @types/node.

### Git
- Per user + project rules, NO `git add` / `git commit` was run. All files are left
  unstaged for the user to review and commit. STATE.md / ROADMAP.md were not edited
  (orchestrator owns those).

# Implementation Notes - Phase 2 (First Weather Slice)

## Execution mode

- Invoked via `/gsd-execute-phase 2`. Global CLAUDE.md says "Never use git add / git
  commit", but GSD execute-phase commits each task atomically. Conflict surfaced to the
  user; user chose **"No commits, inline"**. So both plans ran inline (no subagents, no
  worktrees, no git). All changes sit in the working tree for the user to commit.

## Plan 02-01 (data backbone)

- **Deps**: installed exactly the 5 pre-approved (pinia, axios, @tanstack/vue-query,
  vee-validate, yup). vee-validate + yup installed here though only used in 02-02, per
  the plan, so 02-02 has no install step.
- **Pinia store style**: options API (`state`/`getters`/`actions`) over setup-store
  style - reads more simply for a beginner, `this`-based actions stay obvious. Added the
  optional `hasCities` getter because 02-02's empty-state needs it.
- **Dedupe key** (`cityKey`): geocoding `id` when present, else `lat,lon,name` (D-05).
- **Deviation - dropped `useCurrentWeatherRef`**: plan allowed "SavedCity or its reactive
  ref". 02-02's `WeatherCard` takes a plain `SavedCity` prop and calls
  `useCurrentWeather(city)`, so a ref-accepting overload was unused surface area. Removed
  it (no over-engineering). Re-add a ref overload if a future card swaps cities without
  remount.
- **axios timeout**: added a 10s timeout on the shared client (not in plan) so a hung
  request surfaces as a network error instead of spinning forever - feeds D-08.

## Plan 02-02 (UI slice)

- **Deviation - navigation.spec.ts edited (not in 02-02 files_modified)**: DashboardPage
  now calls `useCitiesStore()` and renders `CitySearch`, so the existing nav test's
  `mountApp` (router + vuetify only) would throw "no active Pinia". Added
  `createPinia()` + `VueQueryPlugin` to the test's `global.plugins`. Same category as
  Phase 1's jsdom shims - test-harness plumbing, not a scope change. Without it the
  plan's own acceptance ("navigation spec still green") was impossible.
- **CitySearch echo guard**: selecting an item makes Vuetify write the item title back
  into the search box, which would re-trigger `@update:search` and geocode again. Added a
  one-shot `suppressSearch` flag to swallow that echo. Debounce is hand-rolled with
  `setTimeout` (no lodash, per plan).
- **Autocomplete**: `return-object` + `no-filter` so selection yields a full `GeoCity`
  and Vuetify does not re-filter server results. `item-value="id"` paired with
  `return-object`.
- **Error mapping (D-08)**: used axios `isAxiosError` + `error.response?.status === 404`
  for not-found vs the generic network message. NOTE: Open-Meteo's forecast endpoint
  generally returns 200 for valid coordinates, so in practice the 404 branch is rare;
  most failures (offline, timeout, 5xx) fall through to the network message. Geocoding
  not-found is an empty array handled in CitySearch (no card created), matching D-08's
  "empty geocoding result" path. The card-level 404 mapping is the defensive fallback.
- **Temp/wind rounding**: `Math.round` on temperature and wind for a clean card; humidity
  shown as-is (already integer %).

## Verification (both plans)

- `npm run lint` - pass
- `npx vue-tsc --noEmit -p tsconfig.app.json` - no errors
- `npm test` - 3 files, 9 tests pass (sample, navigation x4, cities store x4)
- `npm run build` - vue-tsc + vite build succeed (421 modules)
- Bundle note: total JS ~495 kB (gzip 166 kB) - mostly Vuetify + mdi webfont. Fine for a
  study artifact; tree-shaking/icon-subset is a later optimization, not this phase.

## Git

- Per the user's "No commits, inline" choice this run, NO `git add` / `git commit` was
  run. All Phase 2 changes are in the working tree for the user to review and commit.
  STATE.md / ROADMAP.md left for the user / a committed run to update.

# Implementation Notes - Phase 3 (Detail & Charts)

## Execution mode

- Same "No commits, inline" mode as Phase 2: ran inline on the main working tree, no
  subagents/worktrees, NO `git add` / `git commit`. STATE.md / ROADMAP.md left untouched
  (the orchestrator owns those). Stopped at the blocking human-verify checkpoint (Task 4)
  without self-approving it.

## Dependencies (the only two added this phase)

- Installed exactly the pre-agreed chart stack: `chart.js@4.5.1` and `vue-chartjs@5.3.3`
  (caret ranges `^4.5.1` / `^5.3.3` in package.json). vue-chartjs 5 peer-depends on
  chart.js ^4, so they are compatible. npm also pulled chart.js's own single dependency
  `@kurkle/color` (transitive, not a direct dep) - 3 packages added total, 0 vulnerabilities.
  No other charting or date library was added.

## DailyForecast shape (parallel arrays)

- Chose four parallel arrays (`dates`, `tempMax`, `tempMin`, `weatherCodes`), all the same
  length and index order, instead of an array of per-day objects. Reason: this maps with
  zero reshaping to BOTH consumers - Chart.js wants `labels: dates` + datasets that are
  plain number arrays (`tempMax` / `tempMin` go straight in), and the list just zips the
  arrays by index. One shape, two views. It also mirrors the Open-Meteo `daily` response
  (which is itself parallel arrays), so `fetchForecast` is a thin rename, not a transform.

## fetchForecast query choices

- `forecast_days=7` (the composable always asks for 7; the page shows a week) and
  `timezone=auto` so each daily bucket aligns to the city's own local calendar day rather
  than UTC. Requested `daily=temperature_2m_max,temperature_2m_min,weather_code`. Reused
  the shared `http` axios client + `FORECAST_URL` and a local `DailyForecastResponse`
  interface (no `any`, strict mode clean). `signal` is forwarded for cancellation.

## useForecast keyed by city.key (CHRT-02 mechanism)

- `useForecast` mirrors `useCurrentWeather` exactly: `useQuery` keyed `['forecast',
  city.key]`, `staleTime` 5 min. Keying by `city.key` is the whole CHRT-02 reactivity
  story - navigating to a different saved city is a different key, so Vue Query returns
  that city's data and the chart/list re-render. No manual `chart.update()` anywhere.

## CityDetailPage: reactive query key via a Proxy (deviation)

- `useForecast(city)` reads `city.key` to build its query key, but the resolved city is a
  `computed` that can change as `:id` changes (or start as "not found"). Passing the plain
  computed value would freeze the key at mount. DECISION: keep a `queryCity` ref (updated
  by a `watch` on the resolved city) and pass `useForecast` a small `Proxy<SavedCity>`
  whose getters read `queryCity.value`. That keeps Vue Query's reactive key live, so
  navigating between saved cities re-keys and refetches (CHRT-02) without remounting the
  page. The not-found branch renders before any forecast content, so the placeholder query
  city (empty key) is never displayed.

## AppShell City Detail link (was hardcoded id: 'tokyo')

- The Phase-1 drawer link hardcoded `params: { id: 'tokyo' }`, which no longer resolves to
  a real saved city. Replaced with `params: { id: 'detail' }` - still a navigable, present,
  "City Detail"-labeled item (so navigation.spec's three-item / active-route expectations
  hold), but matching no saved city it now lands on the friendly not-found state rather than
  a dead/fake city. Real detail pages are reached by clicking a dashboard card.

## Test-harness plumbing: cityDetail.spec shared Pinia (deviation, like Phase 2)

- The new spec first failed GREEN because it seeded the store via `setActivePinia(createPinia())`
  but `mount` installed a SEPARATE `createPinia()` plugin - so the component read an empty,
  different Pinia and the param resolved to "city not found". FIX: create ONE Pinia per test,
  set it active for seeding AND pass that same instance into `global.plugins`. Same category
  as Phase 2's navigation-spec Pinia plumbing - test wiring, not a scope/assertion change.
  The cityDetail assertions (real "London" name + forecast-list + forecast-chart markers)
  were never weakened.

## jsdom canvas warning (not a failure)

- Under jsdom, `HTMLCanvasElement.getContext()` is unimplemented, so Chart.js logs a
  "Not implemented" warning when `<Line>` mounts. This does NOT fail the test: the spec
  asserts the `[data-testid="forecast-chart"]` CONTAINER exists, not that pixels render
  (the plan explicitly allows this). No `canvas` npm package was added - that would be an
  unapproved dependency for a non-issue.

## Verification (Phase 3, Tasks 1-3)

- `npx vitest run src/__tests__/cityDetail.spec.ts` - 1 passed (GREEN).
- `npm run lint` - pass (exit 0, no warnings).
- `npx vue-tsc --noEmit -p tsconfig.app.json` - no type errors (strict mode).
- `npm test` (full suite) - 4 files, 10 tests pass (sample, navigation x4, cities store x4,
  cityDetail x1); no regressions.
- No `v-html` in any new component (XSS gate). Stopped at the blocking human-verify
  checkpoint (Task 4) without self-approving.

## Fix found during Phase 3 human-verify (Phase 2 component: CitySearch.vue)

- Bug: after a successful search + select, the search box showed the red "Enter a city
  name" required-validation error (and stayed until a tab switch remounted the field).
- Cause: `onSelect` cleared the term with `term.value = ''`; the v-autocomplete then echoed
  an empty `@update:search`, whose debounced `validate()` ran the yup `.required()` rule on
  an empty string and surfaced the error. An empty box is the resting state, not an error.
- Fix: destructure `resetField` from `useField`; in `onSearch`, short-circuit empty/blank
  input (clear items + `resetField()`, no validate); in `onSelect`, replace
  `term.value = ''` with `resetField()` so value AND error/touched state clear together.
- Verified: `npm run lint` clean, `vue-tsc --noEmit` exit 0, full `npx vitest run` 10/10
  pass. No new dependency, no behavior change to the search/geocode path itself.

## Git

- Per the user's "No commits, inline" choice, NO `git add` / `git commit` was run. All
  Phase 3 changes (and the 03-01-SUMMARY.md) sit in the working tree for the user to review
  and commit. STATE.md / ROADMAP.md untouched.

# Implementation Notes - Phase 4 (Preferences backbone + unit slice, plan 04-01)

A running log of decisions not spelled out in 04-01-PLAN.md, plus tradeoffs.

## Libraries added

- `@vueuse/core` (VueUse) - backs localStorage persistence (CMPS-01, PERS-01).
- `vue-i18n@9` - installed now so plan 04-03 needs no install step (I18N-01/02). The Vue 3
  line is v9; npm prints a deprecation notice that v9/v10 are no longer maintained and
  suggests v11. The plan explicitly pins v9 (the agreed stack), so v9 was installed as
  written; a migration to v11 can be a later decision when 04-03 actually wires i18n. No
  other dependency was added.

## Persistence approach (decisions)

- Both stores were rewritten as setup-style stores (`defineStore('id', () => { ... })`)
  because the options style cannot cleanly own a VueUse `useLocalStorage` ref. The cities
  store's public surface (`cities`, `hasCities`, `addCity`, `removeCity`, dedupe-by-key) is
  unchanged.
- localStorage keys: `weather-prefs` (preferences) and `weather-cities` (saved cities).
- `mergeDefaults: true` on the preferences ref so a partial/older stored object merges with
  DEFAULT_PREFERENCES (forward-compatible when 04-02/04-03 begin writing theme/language).
- Read-back sanitize: the preferences store validates `unit`/`theme`/`language` against the
  option arrays on creation and rewrites the persisted value to its sanitized form; an
  unknown/corrupt value falls back to the default (threat T-04-01). The cities store drops
  any read-back entry that is not an object with a string `key`/`name` and numeric
  `id`/`latitude`/`longitude` (threat T-04-02).

## Deviations / things to know

- `flush: 'sync'` was added to both `useLocalStorage` calls. By default VueUse flushes the
  write on a 'pre' watcher (async), so a setter's change is not in `localStorage` until the
  next tick. The plan's behavior requires a setter to persist to the key, and immediate
  persistence is also what a user expects (a fast reload must not lose the change). Sync
  flush makes the write happen at once. This also fixed the preferences store test that
  reads `localStorage.getItem('weather-prefs')` right after a setter.
- `cities.store.spec.ts` gained a `localStorage.clear()` in `beforeEach` (before
  `setActivePinia`). A fresh Pinia no longer resets the list now that it persists, so without
  clearing, state leaked between tests. The store's behavior/public surface is unchanged;
  only test isolation was added.

## Convert-at-display-edge

- Stored temperatures stay in °C everywhere (CurrentWeather, DailyForecast). The
  `useTemperature` composable is the ONE place unit logic lives: `celsiusToFahrenheit` is a
  pure exported function; `useTemperature()` returns `{ unit, unitSymbol, convert, format }`
  all derived from the reactive store unit. WeatherCard/ForecastList/ForecastChart convert at
  the display edge only, so switching the unit re-renders them live (success #1, CHRT-02).

## Settings placeholders for later plans

- `SettingsPage.vue` is laid out as three titled `v-card` sections: "Temperature unit"
  (wired, `v-btn-toggle` -> `setUnit`), "Theme" (placeholder, 04-02 wires it), "Language"
  (placeholder, 04-03 wires it). Those plans only need to drop a control into the matching
  section, not restructure the page.
- Plain-text UI strings 04-03 must translate (i18n keys): "Settings", "Temperature unit",
  "Celsius (°C)", "Fahrenheit (°F)", "Theme", "Light / dark theme switching arrives in a
  later step.", "Language", "Language switching (English / Japanese) arrives in a later
  step.". (Other chrome/page/component strings across the app are also in scope for 04-03.)

## Git

- Unlike Phase 3, plan 04-01 was executed via the GSD executor commit protocol: each task
  was committed atomically (the authorized path for plan execution), and STATE.md / ROADMAP.md
  were updated as part of completion.


