---
phase: 01-foundation-shell
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
  - vite.config.ts
  - tsconfig.json
  - tsconfig.node.json
  - index.html
  - .eslintrc.cjs
  - .prettierrc.json
  - .gitignore
  - vitest.config.ts
  - src/main.ts
  - src/App.vue
  - src/plugins/vuetify.ts
  - src/router/index.ts
  - src/layouts/AppShell.vue
  - src/pages/DashboardPage.vue
  - src/pages/CityDetailPage.vue
  - src/pages/SettingsPage.vue
  - src/__tests__/navigation.spec.ts
  - src/__tests__/sample.spec.ts
  - implementation-notes.md
autonomous: false
requirements:
  - SETUP-01
  - SETUP-02
  - SETUP-03
  - UI-01
  - UI-03
  - NAV-01
  - NAV-03
must_haves:
  truths:
    - "App boots with `npm run dev` and renders without console errors"
    - "`npm run lint` passes on the clean project"
    - "`npm test` runs and a sample test passes"
    - "A Vuetify app bar and a responsive navigation drawer are visible"
    - "Drawer links navigate between Dashboard, City Detail, and Settings routes"
    - "The active route is visually highlighted in the navigation drawer"
  artifacts:
    - path: "package.json"
      provides: "Project manifest with dev/build/lint/test scripts and the agreed dependency set"
      contains: "\"dev\""
    - path: "src/main.ts"
      provides: "App entry: mounts Vue with Vuetify plugin and router"
      contains: "createApp"
    - path: "src/plugins/vuetify.ts"
      provides: "Vuetify 4 instance configuration"
      contains: "createVuetify"
    - path: "src/router/index.ts"
      provides: "Vue Router with Dashboard, City Detail, Settings routes"
      contains: "createRouter"
    - path: "src/layouts/AppShell.vue"
      provides: "App bar + responsive navigation drawer with active-route links"
      min_lines: 30
    - path: "src/pages/DashboardPage.vue"
      provides: "Empty Dashboard route view"
    - path: "src/pages/CityDetailPage.vue"
      provides: "Empty City Detail route view"
    - path: "src/pages/SettingsPage.vue"
      provides: "Empty Settings route view"
    - path: "src/__tests__/navigation.spec.ts"
      provides: "End-to-end navigation test (drawer links switch the rendered page)"
      contains: "mount"
  key_links:
    - from: "src/main.ts"
      to: "src/router/index.ts"
      via: "app.use(router)"
      pattern: "use\\(router\\)"
    - from: "src/main.ts"
      to: "src/plugins/vuetify.ts"
      via: "app.use(vuetify)"
      pattern: "use\\(vuetify\\)"
    - from: "src/router/index.ts"
      to: "src/pages/*"
      via: "route component imports"
      pattern: "DashboardPage|CityDetailPage|SettingsPage"
    - from: "src/layouts/AppShell.vue"
      to: "src/router/index.ts"
      via: "v-list-item :to / RouterLink with active class"
      pattern: "to=|:to="
---

<objective>
Stand up the Walking Skeleton for the Vue Weather Dashboard: a running Vue 3 + TypeScript + Vite app with ESLint/Prettier, Vitest, a Vuetify 4 app bar + responsive navigation drawer, and Vue Router wiring three empty pages (Dashboard, City Detail, Settings). The single real end-to-end interaction proven this phase is navigation: clicking a drawer link switches the rendered route and highlights the active item.

Purpose: This is the architectural backbone every later vertical slice builds on (see 01-SKELETON.md). Phases 2-4 add data, charts, preferences, and tests on top of this shell without re-litigating its structure. It is also the user's Vue study reference, so the code must favor readability over cleverness.

Output: A bootable, lint-clean, test-passing app skeleton with navigation working end to end. No real weather data, API calls, or state stores in this phase - those start in Phase 2.
</objective>

<phase_goal>
## Phase Goal

**As a** developer studying Vue, **I want to** open a running app that shows a Vuetify app bar and a navigation drawer and lets me move between the Dashboard, City Detail, and Settings pages, **so that** I have a real, working Vue 3 + TypeScript shell to build every later feature on and to learn how the pieces connect.
</phase_goal>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-foundation-shell/01-SKELETON.md
@CLAUDE.md

# Notes for the executor:
# - This is a GREENFIELD project. There is no package.json yet; you are scaffolding from zero.
# - Project rules (CLAUDE.md): readability over cleverness; Open-Meteo only (no data this phase);
#   frontend only; do NOT add dependencies beyond the agreed list below without flagging the user.
# - User text rule: never use the "—" em-dash character; use "-" instead.
# - User git rule: do NOT run `git add` or `git commit`. Leave changes unstaged for the user.
# - Keep a running implementation-notes.md with any decision not spelled out in this plan.
#
# Agreed dependency set for THIS phase (latest stable verified 2026-06-11):
#   runtime:  vue@^3.5, vue-router@^5.1, vuetify@^4.1, @mdi/font@^7.4
#   dev:      vite@^8, @vitejs/plugin-vue@^6, vite-plugin-vuetify@^2,
#             typescript@~6.0, vue-tsc, eslint@^10 + eslint-plugin-vue + @vue/eslint-config-typescript + @vue/eslint-config-prettier,
#             prettier@^3, vitest@^4, @vue/test-utils@^2, jsdom
#   Pinia / axios / TanStack Vue Query / vee-validate / yup / chart.js / vue-chartjs / vue-i18n / VueUse
#   belong to LATER phases - do NOT install them now.
</context>

<artifacts_this_phase_produces>
Config / project files:
- package.json (scripts: dev, build, preview, lint, test; the agreed deps above)
- vite.config.ts (Vue plugin + vite-plugin-vuetify autoImport)
- tsconfig.json, tsconfig.node.json
- index.html (mount point #app)
- .eslintrc.cjs (or eslint.config.* flat config - executor picks per ESLint 10 default)
- .prettierrc.json
- .gitignore (node_modules, dist, etc.)
- vitest.config.ts (jsdom environment, globals)

Source files / symbols:
- src/main.ts - createApp(App).use(router).use(vuetify).mount('#app')
- src/App.vue - renders <AppShell> wrapping <RouterView>
- src/plugins/vuetify.ts - exports `vuetify` (createVuetify with default light theme)
- src/router/index.ts - exports `router`; routes: '/' -> DashboardPage (name 'dashboard'),
  '/city/:id' -> CityDetailPage (name 'city-detail'), '/settings' -> SettingsPage (name 'settings')
- src/layouts/AppShell.vue - v-app > v-app-bar (with drawer toggle) + v-navigation-drawer (nav links) + v-main > slot/RouterView
- src/pages/DashboardPage.vue - empty placeholder view
- src/pages/CityDetailPage.vue - empty placeholder view (reads :id later; just renders this phase)
- src/pages/SettingsPage.vue - empty placeholder view

Tests:
- src/__tests__/navigation.spec.ts - mounts the app with a test router, asserts drawer link click switches rendered page (E2E navigation)
- src/__tests__/sample.spec.ts - one trivial always-passing sanity test (satisfies SETUP-03 "sample test")

Docs:
- implementation-notes.md - running log of decisions not in this plan
</artifacts_this_phase_produces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Scaffold the project and write the failing navigation test (RED)</name>
  <files>package.json, vite.config.ts, tsconfig.json, tsconfig.node.json, index.html, .eslintrc.cjs, .prettierrc.json, .gitignore, vitest.config.ts, src/main.ts, src/App.vue, src/router/index.ts, src/pages/DashboardPage.vue, src/pages/CityDetailPage.vue, src/pages/SettingsPage.vue, src/__tests__/navigation.spec.ts, src/__tests__/sample.spec.ts, implementation-notes.md</files>
  <read_first>
    - .planning/phases/01-foundation-shell/01-SKELETON.md (architectural decisions: directory layout, route names, plugin approach)
    - CLAUDE.md (no em-dash; no git add/commit; readability over cleverness; keep implementation-notes.md)
  </read_first>
  <behavior>
    - navigation.spec.ts (E2E, RED at end of this task): mount App with a real vue-router memory-history router and the three routes. Initial render shows Dashboard content. Programmatically navigate (router.push) to '/settings' -> rendered output contains Settings page marker. Navigate to '/city/tokyo' -> rendered output contains City Detail page marker. This test is allowed to FAIL until Task 2 wires Vuetify + AppShell, but it MUST compile and run.
    - sample.spec.ts (SETUP-03): one test asserting a trivial truth (e.g. expect(1 + 1).toBe(2)) - passes immediately.
  </behavior>
  <action>
    Scaffold a Vite + Vue 3 `<script setup>` + TypeScript project from zero (no package.json exists yet). Prefer `npm create vite@latest . -- --template vue-ts` into the current directory, then reconcile generated files; if the directory-not-empty guard blocks it, scaffold in a temp dir and copy files in. Install ONLY the agreed dependency set listed in the plan context (verified-latest versions: vue@^3.5, vue-router@^5.1, vuetify@^4.1, @mdi/font@^7.4 runtime; vite@^8, @vitejs/plugin-vue@^6, vite-plugin-vuetify@^2, typescript@~6.0, vue-tsc, eslint@^10 + eslint-plugin-vue + @vue/eslint-config-typescript + @vue/eslint-config-prettier, prettier@^3, vitest@^4, @vue/test-utils@^2, jsdom). Do NOT install Pinia/axios/Vue Query/vee-validate/yup/chart.js/vue-chartjs/vue-i18n/VueUse - those are later phases (SETUP-01). Configure ESLint + Prettier so they coexist without rule conflicts and `npm run lint` is meaningful (SETUP-02). Configure vitest.config.ts with jsdom environment + globals so component mounting works (SETUP-03). Add package.json scripts: dev, build (vue-tsc + vite build), preview, lint, test. Create src/router/index.ts exporting `router` with three named routes per the artifacts list (NAV-01): '/' dashboard, '/city/:id' city-detail, '/settings' settings, using createWebHistory. Create the three empty page components, each rendering a clear, testable marker string (e.g. a heading with the page name) - readability over cleverness, this is a study artifact. Create src/App.vue and src/main.ts as minimal mounts (App may temporarily render just <RouterView> in this task; AppShell is added in Task 2). Write src/__tests__/navigation.spec.ts and src/__tests__/sample.spec.ts per the behavior block; run them and confirm sample passes and navigation runs (it may fail its assertions until Task 2 - that is the intended RED state). Start implementation-notes.md and record any choices not in this plan (e.g. ESLint flat-config vs legacy, exact route-component import style). Never use the "—" character anywhere. Do NOT run git add/commit.
  </action>
  <verify>
    <automated>npm install && npx vitest run src/__tests__/sample.spec.ts</automated>
  </verify>
  <acceptance_criteria>
    - `npm install` completes and only the agreed packages (plus their transitive deps) are present; no Pinia/axios/Vue Query/vee-validate/chart.js/vue-i18n/VueUse in package.json.
    - `npx vitest run src/__tests__/sample.spec.ts` passes (SETUP-03 sample test).
    - src/router/index.ts exports `router` with three named routes including '/city/:id' (NAV-01).
    - Each of the three page components renders a unique, assertable marker.
    - navigation.spec.ts compiles and runs (assertions may still fail - RED is expected here).
    - implementation-notes.md exists with at least the scaffolding decisions recorded.
  </acceptance_criteria>
  <done>Project scaffolds, installs the agreed stack only, sample test passes, router + three empty pages exist, and the E2E navigation test runs (RED).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add the Vuetify shell and wire navigation (GREEN)</name>
  <files>src/main.ts, src/App.vue, src/plugins/vuetify.ts, src/layouts/AppShell.vue, src/__tests__/navigation.spec.ts, implementation-notes.md</files>
  <read_first>
    - src/router/index.ts (route names/paths to link from the drawer)
    - src/pages/DashboardPage.vue, src/pages/CityDetailPage.vue, src/pages/SettingsPage.vue (marker strings the nav test asserts)
    - .planning/phases/01-foundation-shell/01-SKELETON.md (shell layout decision)
  </read_first>
  <behavior>
    - After this task, navigation.spec.ts goes GREEN: initial render shows Dashboard; navigating to '/settings' and '/city/:id' swaps the rendered page; the active drawer item carries an active class/state for the current route (NAV-03).
  </behavior>
  <action>
    Create src/plugins/vuetify.ts exporting `vuetify` via createVuetify with the mdi icon set and a default light theme; import '@mdi/font/css/materialdesignicons.css' and Vuetify styles (relying on vite-plugin-vuetify autoImport for components/directives) (UI-01). Wire src/main.ts to `createApp(App).use(router).use(vuetify).mount('#app')`. Build src/layouts/AppShell.vue using `v-app` as the root, a `v-app-bar` containing an app title and a `v-app-bar-nav-icon` that toggles the drawer, a `v-navigation-drawer` whose `v-list-item`s use `:to` (router links) to Dashboard, City Detail, and Settings, and a `v-main` that renders `<RouterView />` (or a default slot containing it). Use Vuetify's built-in active styling for router-linked list items so the current route is highlighted - rely on `v-list-item` `:to` + `active-class`/router-link active behavior rather than hand-rolled comparisons where possible (NAV-03). Make the drawer responsive: it should behave appropriately on mobile vs desktop widths (e.g. temporary/overlay on small screens, permanent/rail-or-expanded on large) using Vuetify's drawer props and the display breakpoints - no custom media queries needed (UI-03). Update src/App.vue to render `<AppShell>`. For City Detail, link to a concrete sample param (e.g. '/city/tokyo') from the drawer so the link is navigable this phase. Then make navigation.spec.ts assert the active-route highlight and full link-driven navigation, and run it to GREEN. Record any shell decisions (drawer breakpoint behavior, active-class choice) in implementation-notes.md. No em-dash; no git add/commit.
  </action>
  <verify>
    <automated>npx vitest run src/__tests__/navigation.spec.ts</automated>
  </verify>
  <acceptance_criteria>
    - src/main.ts registers both router and vuetify (`use(router)` and `use(vuetify)`).
    - AppShell renders a v-app-bar and a v-navigation-drawer with links to all three routes (UI-01).
    - navigation.spec.ts passes: link/route changes swap the rendered page and the active item is highlighted (NAV-03).
    - Drawer uses Vuetify responsive props (no hand-written media queries) (UI-03).
  </acceptance_criteria>
  <done>Vuetify shell renders, drawer links drive navigation, active route is highlighted, and the E2E navigation test passes (GREEN).</done>
</task>

<task type="auto">
  <name>Task 3: Verify the full skeleton boots, lints, and tests clean</name>
  <files>package.json, .eslintrc.cjs, .prettierrc.json, implementation-notes.md</files>
  <read_first>
    - package.json (confirm dev/build/lint/test scripts)
  </read_first>
  <action>
    Run the full quality gate and fix anything that fails: `npm run lint` must pass on the clean project (fix lint/format violations; ensure ESLint + Prettier do not fight) (SETUP-02); `npm test` (vitest run) must pass all tests including the sample and navigation tests (SETUP-03); `npm run build` (vue-tsc typecheck + vite build) must succeed with no type errors; and `npm run dev` must serve without console errors (SETUP-01) - do a brief boot check and stop the dev server. Confirm no stray dependencies were added beyond the agreed list. Append a final summary of the working scripts and any remaining decisions to implementation-notes.md. No em-dash; do NOT run git add/commit - leave all changes unstaged for the user.
  </action>
  <verify>
    <automated>npm run lint && npx vitest run && npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `npm run lint` exits 0 (SETUP-02).
    - `npx vitest run` passes every test (SETUP-03).
    - `npm run build` completes with no TypeScript errors.
    - `npm run dev` serves the app (verified briefly) (SETUP-01).
    - package.json contains no dependencies beyond the agreed Phase-1 list.
  </acceptance_criteria>
  <done>Lint, tests, and build all pass; the app boots clean; the skeleton is ready for Phase 2.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Human verification - shell renders and navigates in the browser</name>
  <what-built>A bootable Vue 3 + TS + Vuetify 4 app shell: app bar + responsive navigation drawer routing between empty Dashboard, City Detail, and Settings pages, with the active route highlighted. Lint, tests, and build all pass.</what-built>
  <how-to-verify>
    1. Run `npm run dev` and open the served URL (usually http://localhost:5173).
    2. Confirm the page renders with NO red errors in the browser console.
    3. Confirm you see a Vuetify app bar (with a title and a drawer toggle icon) and a navigation drawer.
    4. Click each drawer link: Dashboard, City Detail, Settings. Confirm the main area swaps to the matching empty page and the URL changes.
    5. Confirm the currently selected drawer item is visually highlighted (active state).
    6. Narrow the browser window to a mobile width and confirm the drawer collapses/behaves responsively (e.g. toggles via the app-bar icon) rather than overflowing.
    7. In a second terminal, optionally confirm `npm run lint` and `npm test` both pass.
  </how-to-verify>
  <resume-signal>Type "approved" if the shell renders, navigates, highlights the active route, and is responsive - or describe what looks wrong.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry -> dev machine | `npm install` pulls third-party packages and runs lifecycle scripts during scaffolding |
| Vite dev server -> local network | `npm run dev` opens a local HTTP server on the developer machine |

This phase is a static frontend scaffold: no backend, no auth, no user accounts, no persisted user data, and no external API calls yet (Open-Meteo integration starts Phase 2). The application-level attack surface is effectively nil; the only real surface is the toolchain/supply chain.

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-SC | Tampering | npm install (scaffold + agreed deps) | mitigate | Install ONLY the explicitly agreed, well-known packages (vue, vue-router, vuetify, vite, vitest, eslint, prettier, etc.); pin to caret ranges of verified-latest versions; do not add unvetted packages. All packages are canonical, top-download ecosystem libraries (not [ASSUMED]/[SUS]/[SLOP]), so no per-package legitimacy checkpoint is required. |
| T-01-02 | Information disclosure | Vite dev server binding | accept | Dev server binds to localhost by default; this is a local-only study project (deployment/CI explicitly out of scope). No action needed unless `--host` is added later. |
| T-01-03 | Denial of service | Public Open-Meteo API | accept | No network calls exist in this phase; revisit in Phase 2 when axios/Vue Query are introduced. |

Severity assessment: no high-severity threats in scope. The supply-chain item is mitigated by restricting installs to the agreed, mainstream package set. Nothing here blocks the phase.
</threat_model>

<verification>
Phase-level checks (all must hold before the phase is done):
- `npm run dev` serves the app and the browser console is error-free (Success Criterion 1, SETUP-01).
- `npm run lint` exits 0 (Success Criterion 2, SETUP-02).
- `npm test` (vitest run) passes, including the sample test and the E2E navigation test (Success Criterion 2, SETUP-03).
- App bar + responsive navigation drawer link to Dashboard, City Detail, and Settings; the active route is highlighted (Success Criterion 3, UI-01 / UI-03 / NAV-01 / NAV-03).
- `npm run build` (vue-tsc + vite build) completes with no type errors.
- No dependencies beyond the agreed Phase-1 set are present.
</verification>

<success_criteria>
- [ ] SETUP-01: `npm run dev` runs the scaffolded Vite + Vue 3 `<script setup>` + TS app, rendering without console errors.
- [ ] SETUP-02: ESLint + Prettier configured; `npm run lint` passes on the clean project.
- [ ] SETUP-03: Vitest + @vue/test-utils wired; `npm test` runs and the sample test passes.
- [ ] UI-01: Vuetify 4 installed with a responsive app bar and navigation drawer.
- [ ] UI-03: Layout is responsive across mobile and desktop widths (Vuetify drawer breakpoints).
- [ ] NAV-01: Vue Router configured with Dashboard, City Detail (`/city/:id`), and Settings routes.
- [ ] NAV-03: Active route is reflected (highlighted) in the navigation drawer.
- [ ] E2E navigation test passes (drawer link / route change swaps the rendered page).
</success_criteria>

<source_audit>
## Multi-Source Coverage Audit

| Source | Item | Covered by |
|--------|------|-----------|
| GOAL | Running Vue 3 + TS app boots with `npm run dev` | Task 1 (scaffold), Task 3 (boot check) |
| GOAL | Vuetify app bar + navigation drawer on screen | Task 2 (AppShell), Task 4 (human verify) |
| GOAL | Routes between empty Dashboard, City Detail, Settings | Task 1 (router + pages), Task 2 (drawer links) |
| REQ | SETUP-01 (Vite+Vue3+TS, npm run dev) | Task 1, Task 3 |
| REQ | SETUP-02 (ESLint+Prettier, npm run lint) | Task 1 (config), Task 3 (gate) |
| REQ | SETUP-03 (Vitest+test-utils, sample test) | Task 1 (sample test), Task 3 (gate) |
| REQ | UI-01 (Vuetify app bar + drawer) | Task 2 |
| REQ | UI-03 (responsive layout) | Task 2 (responsive drawer), Task 4 (mobile check) |
| REQ | NAV-01 (router: Dashboard/Detail/Settings) | Task 1 |
| REQ | NAV-03 (active route highlighted) | Task 2 |
| RESEARCH | (none - research skipped by user choice) | n/a |
| CONTEXT | (none - discuss skipped by user choice) | n/a |

No MISSING items. Excluded by scope (other phases): all STATE/SRCH/DATA/WTHR/CHRT/CMPS/I18N/PERS/TEST and UI-02 / NAV-02 requirements belong to Phases 2-4. v2 (ENH-*) and Out-of-Scope items are excluded by REQUIREMENTS.md.
</source_audit>

<output>
Create `.planning/phases/01-foundation-shell/01-01-SUMMARY.md` when done.
</output>
