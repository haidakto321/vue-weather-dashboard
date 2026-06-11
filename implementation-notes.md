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
