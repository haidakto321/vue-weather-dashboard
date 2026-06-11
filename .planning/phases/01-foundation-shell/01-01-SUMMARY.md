---
phase: 01-foundation-shell
plan: 01
subsystem: foundation-shell
tags: [vue3, typescript, vite, vuetify, vue-router, vitest, eslint, prettier, scaffold]
requires: []
provides:
  - Bootable Vue 3 + TS + Vite app shell
  - Vuetify 4 app bar + responsive navigation drawer
  - Vue Router with dashboard / city-detail / settings routes
  - ESLint 10 + Prettier 3 lint gate
  - Vitest + @vue/test-utils + jsdom test harness
  - E2E navigation test (drawer link / route change swaps the page)
affects:
  - All later phases build on this src/ layout and the AppShell + router
tech-stack:
  added:
    - vue@3.5.38
    - vue-router@5.1.0
    - vuetify@4.1.1
    - "@mdi/font@7.4.47"
    - vite@8.0.16
    - "@vitejs/plugin-vue@6.0.7"
    - vite-plugin-vuetify@2.1.3
    - typescript@6.0.3
    - vue-tsc@3.3.4
    - eslint@10.4.1
    - eslint-plugin-vue@10.9.2
    - "@vue/eslint-config-typescript@14.8.0"
    - "@vue/eslint-config-prettier@10.2.0"
    - prettier@3.8.4
    - vitest@4.1.8
    - "@vue/test-utils@2.4.11"
    - jsdom@29.1.1
  patterns:
    - "Vuetify wired via vite-plugin-vuetify autoImport (tree-shaken components)"
    - "ESLint 10 flat config (eslint.config.mjs) with Prettier preset last"
    - "Router-link active state drives drawer highlight (no manual route compare)"
    - "Responsive drawer via Vuetify useDisplay() breakpoints (no media queries)"
key-files:
  created:
    - package.json
    - package-lock.json
    - index.html
    - vite.config.ts
    - vitest.config.ts
    - tsconfig.json
    - tsconfig.app.json
    - tsconfig.node.json
    - eslint.config.mjs
    - .prettierrc.json
    - .gitignore
    - src/main.ts
    - src/App.vue
    - src/vite-env.d.ts
    - src/plugins/vuetify.ts
    - src/router/index.ts
    - src/layouts/AppShell.vue
    - src/pages/DashboardPage.vue
    - src/pages/CityDetailPage.vue
    - src/pages/SettingsPage.vue
    - src/__tests__/navigation.spec.ts
    - src/__tests__/sample.spec.ts
    - implementation-notes.md
  modified: []
decisions:
  - "ESLint flat config authored as eslint.config.mjs (not .ts / not .eslintrc.cjs) so it loads without jiti and without any dep outside the agreed set"
  - "Removed node:url / import.meta.url from vite & vitest configs; use Vite root-relative alias '@' -> '/src' to avoid needing @types/node"
  - "Dropped deprecated tsconfig baseUrl; path alias resolves under bundler moduleResolution"
  - "Pages imported eagerly in the router for beginner readability"
metrics:
  duration: ~12 min
  completed: 2026-06-11
  tasks_completed: 3
  tasks_total: 4
  files_created: 23
---

# Phase 1 Plan 01: Foundation & Shell Summary

Scaffolded a bootable Vue 3 + TypeScript + Vite app from zero with a Vuetify 4 app bar and
responsive navigation drawer routing between empty Dashboard, City Detail, and Settings
pages, proven end to end by a Vitest navigation test; lint, tests, and build all pass.

## What Was Built

- A greenfield Vite + Vue 3 `<script setup>` + TypeScript project (no template cruft).
- ESLint 10 (flat config) + Prettier 3 configured to coexist; `npm run lint` is a real gate.
- Vitest 4 + @vue/test-utils + jsdom test harness with globals enabled.
- Vue Router 5 with three named routes: `/` (dashboard), `/city/:id` (city-detail),
  `/settings` (settings), using createWebHistory.
- Vuetify 4 plugin (mdi icons, light theme) auto-imported via vite-plugin-vuetify.
- `src/layouts/AppShell.vue`: `v-app` > `v-app-bar` (title + drawer toggle) +
  responsive `v-navigation-drawer` (router-linked list items, active highlight) +
  `v-main` rendering `<RouterView />`.
- Two tests: a trivial sample test and an E2E navigation test (4 cases: initial render,
  programmatic route swap, active-item highlight, click-a-drawer-link navigation).
- `implementation-notes.md` capturing every off-plan decision.

## TDD Flow (Tasks 1 and 2)

- Task 1 (RED): wrote `navigation.spec.ts` before the shell existed. It compiled and ran;
  2 of 4 cases passed (App rendered RouterView) and 2 failed (no drawer / no active state)
  - the intended RED. Sample test passed.
- Task 2 (GREEN): added the Vuetify plugin + AppShell and wired main.ts/App.vue. All 4
  navigation cases turned GREEN.

## Verification Results (Task 3 quality gate)

| Command            | Result                                                        |
| ------------------ | ------------------------------------------------------------- |
| `npm run lint`     | PASS - exits 0, no warnings/errors                            |
| `npx vitest run`   | PASS - 2 files, 5 tests passed (sample + 4 navigation cases)  |
| `npm run build`    | PASS - vue-tsc typecheck clean + vite build (194 modules)     |
| `npm run dev`      | PASS - ready ~340 ms, HTTP 200 at localhost:5173, no errors   |

Dependency audit: dependencies + devDependencies are exactly the agreed Phase-1 set.
Confirmed absent: pinia, axios, @tanstack/vue-query, vee-validate, yup, chart.js,
vue-chartjs, vue-i18n, @vueuse/core (later phases), plus jiti and @types/node.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint flat config could not load as `.ts`**
- Found during: Task 3 (`npm run lint`).
- Issue: ESLint 10 requires the `jiti` library to load a `eslint.config.ts`; `jiti` is not
  in the agreed dependency set.
- Fix: authored the config as `eslint.config.mjs` (plain ESM). Loads with zero extra deps.
- Files: eslint.config.mjs (replaces the briefly-created eslint.config.ts).

**2. [Rule 3 - Blocking] `npm run build` type errors from node APIs and deprecated baseUrl**
- Found during: Task 3 (`npm run build` / vue-tsc).
- Issue: (a) `baseUrl` is deprecated in TS 6; (b) vite/vitest configs used
  `node:url` + `import.meta.url`, which need `@types/node` (not in the agreed set).
- Fix: removed `baseUrl` (alias resolves under bundler resolution); replaced the URL-based
  alias with Vite's root-relative `'@': '/src'` so no node types are needed.
- Files: tsconfig.app.json, vite.config.ts, vitest.config.ts.

### Plan-vs-reality config-format notes (not scope changes)

- Plan named `.eslintrc.cjs`; ESLint 10 dropped that format -> used flat `eslint.config.mjs`.
- Plan named `tsconfig.json` + `tsconfig.node.json`; the modern Vite vue-ts layout is a
  3-file solution split, so `tsconfig.app.json` was added (the app half of the same config).

All deviations are logged in `implementation-notes.md`.

## Authentication Gates

None - this phase has no auth, no backend, no network calls.

## Known Stubs

The three page components (Dashboard, City Detail, Settings) are intentional empty
placeholders for this phase; each renders a unique heading marker. This is by design:
Phase 1 ships only the shell + navigation. Real content arrives in Phases 2-4 (documented
in 01-SKELETON.md "Subsequent Slice Plan"). No stub blocks the Phase 1 goal.

## Git Status

Per user + project CLAUDE.md rules, NO `git add` / `git commit` was run. All files are left
unstaged in the working tree for the user to review and commit. STATE.md and ROADMAP.md
were not edited (the orchestrator owns those).

## Checkpoint Reached

Task 4 is a `gate="blocking"` `checkpoint:human-verify`. Tasks 1-3 are complete and all
automated gates pass. Execution PAUSED before Task 4 for the user to verify the shell in a
real browser. The verification steps are quoted in the execution report.

## Self-Check: PASSED

- All 23 listed files exist on disk.
- `npm run lint`, `npx vitest run`, and `npm run build` all pass (re-verified).
- No git commits were made (intentional, per rules), so commit-hash checks are N/A.
