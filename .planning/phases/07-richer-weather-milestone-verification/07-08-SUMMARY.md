---
phase: 07-richer-weather-milestone-verification
plan: 08
subsystem: testing
tags: [playwright, e2e, vite, vue-router, smoke-test]

# Dependency graph
requires:
  - phase: 07-01
    provides: "@playwright/test installed as devDependency"
  - phase: 07-05
    provides: "weather-card data-testid on WeatherCard.vue"
  - phase: 07-06
    provides: "GeolocationButton, CityDetailPage current-conditions panel (feature-complete app for e2e coverage)"
  - phase: 07-07
    provides: "wind-unit toggle (feature-complete app for e2e coverage)"
provides:
  - "playwright.config.ts: webServer (npm run dev) + single chromium project"
  - "tsconfig.e2e.json: unreferenced from root tsconfig, keeps npm run build scope unchanged"
  - "e2e/smoke.spec.ts: milestone-closing real-browser smoke test (search -> card -> detail -> forecast + charts)"
  - "city-search data-testid on CitySearch.vue"
  - "vite pinned to ^7.3.6 (downgrade from ^8.0.16) - required for vue-router to mount at all in a real browser"
  - "vitest.config.ts excludes e2e/ from the unit test glob"
affects: [testing, build-tooling, dependency-versions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Playwright smoke test uses only auto-waiting locators (getByTestId/getByRole), no manual waitForTimeout"
    - "vitest.config.ts test.exclude keeps Playwright specs out of the Vitest runner's glob"

key-files:
  created:
    - playwright.config.ts
    - tsconfig.e2e.json
    - e2e/smoke.spec.ts
  modified:
    - src/components/CitySearch.vue
    - package.json
    - package-lock.json
    - .gitignore
    - vitest.config.ts

key-decisions:
  - "Downgraded vite from ^8.0.16 to ^7.3.6 (user-approved) after isolating a vite 8's Rolldown-based dev pre-bundler bug that crashes vue-router@5.1.0 at mount time in a real browser (init_runtime_dom_esm_bundler is not defined). Chosen over downgrading vue-router because the bug lives in vite's pre-bundler, not vue-router itself, and vue-router is depended on by all of Phases 5-7."
  - "city-search data-testid sits on Vuetify's v-autocomplete wrapper div, not the actual <input> - the smoke test targets .locator('input') within it for click/fill."
  - "vitest.config.ts now excludes e2e/ - Vitest's default include glob otherwise also matches e2e/smoke.spec.ts, crashing with a test-runner collision (\"Playwright Test did not expect test() to be called here\")."

requirements-completed: [TEST-06]

# Metrics
duration: ~25min (continuation session after prior checkpoint)
completed: 2026-07-09
---

# Phase 07 Plan 08: Playwright E2E Smoke Test Summary

**Milestone-closing Playwright smoke test (search -> card -> detail -> forecast + charts) passing against a real Vite dev server and the real Open-Meteo API, after downgrading vite ^8.0.16 -> ^7.3.6 to fix a Rolldown pre-bundler incompatibility with vue-router that prevented the app from mounting in a real browser at all.**

## Performance

- **Duration:** ~25 min (this continuation session; picks up after a prior session's checkpoint where Task 1 was completed and Task 2 was blocked)
- **Started (this session):** 2026-07-09T13:32:53Z (checkpoint resume)
- **Completed:** 2026-07-09T13:56:17Z
- **Tasks:** 2/2 (Task 1 completed in prior session at commit `74ce714`; Task 2 completed this session)
- **Files modified:** 7 (package.json, package-lock.json, src/components/CitySearch.vue, e2e/smoke.spec.ts, vitest.config.ts, plus Task 1's playwright.config.ts/tsconfig.e2e.json/.gitignore from the prior session)

## Accomplishments
- Fixed a confirmed vite 8.x + vue-router 5.1.0 mounting incompatibility by downgrading vite to 7.3.6 (last release before the Rolldown-based dev pre-bundler)
- Added `data-testid="city-search"` to CitySearch.vue's v-autocomplete
- Wrote and passed `e2e/smoke.spec.ts`: the full search -> card -> detail -> forecast-list + forecast-chart + hourly-chart flow, against the real dev server and real Open-Meteo API
- Fixed a test-runner collision between Vitest and Playwright by excluding `e2e/` from vitest.config.ts's test glob
- Verified no regression: full unit suite (54/54 tests), `npm run build`, and `npm run lint` all pass after the vite downgrade

## Task Commits

Each task was committed atomically:

1. **Task 1: Create playwright.config.ts + tsconfig.e2e.json + package.json script + gitignore** - `74ce714` (feat) - completed in prior session
2. **Task 2 (deviation, own commit): downgrade vite to 7.3.6** - `29adfb2` (fix)
3. **Task 2: Add city-search testid + write the smoke test + run it** - `9b14e6e` (feat)

**Plan metadata:** (this commit, following)

## Files Created/Modified
- `playwright.config.ts` - testDir './e2e', single chromium project, webServer against `npm run dev` on port 5173
- `tsconfig.e2e.json` - e2e-only tsconfig, deliberately NOT referenced from root tsconfig.json
- `e2e/smoke.spec.ts` - the milestone-closing smoke test
- `src/components/CitySearch.vue` - added `data-testid="city-search"` to the v-autocomplete
- `package.json` / `package-lock.json` - added `test:e2e` script (Task 1); downgraded `vite` devDependency from `^8.0.16` to `^7.3.6` (Task 2 deviation)
- `.gitignore` - Playwright artifact-directory ignores (`/test-results/`, `/playwright-report/`, `/blob-report/`, `/playwright/.cache/`)
- `vitest.config.ts` - added `test.exclude` covering `e2e/**` so Vitest and Playwright specs don't collide

## Decisions Made
- **Downgrade vite ^8.0.16 -> ^7.3.6, not vue-router**: the previous executor isolated the bug to vite 8's Rolldown-based dev pre-bundler specifically (confirmed via 7 independent isolation steps: clean checkout reproduction, stripped-down main.ts + router-only reproduction, ruled out route-level code-splitting, ruled out this plan's own CitySearch/e2e changes). Downgrading vite has lower blast radius than downgrading vue-router, since vue-router 5.1.0 is a dependency all of Phases 5-7's code already builds on. User was presented 4 options (downgrade vite, downgrade vue-router, defer TEST-06, investigate further) and chose the vite downgrade. Peer deps re-verified compatible: `@vitejs/plugin-vue@6.0.7` (`^5||^6||^7||^8`) and `vite-plugin-vuetify` (`>=5`).
- **city-search testid targets the wrapper, test targets the inner `<input>`**: Vuetify's `v-autocomplete` puts `data-testid` on its outer wrapper `<div>`, not the actual form control. Rather than restructure the component (out of scope, higher risk), the test locates `.locator('input')` inside the testid element for `.click()`/`.fill()`.
- **vitest.config.ts excludes `e2e/`**: this is a correctness gap the plan didn't anticipate - adding `e2e/smoke.spec.ts` without excluding it from Vitest's default glob broke `npm run test` outright (a hard crash, not just a false failure). Fixed as part of this plan's scope since it was directly caused by this plan's own new file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 4 - Architectural, user-approved] Downgraded vite from ^8.0.16 to ^7.3.6**
- **Found during:** Task 2 (running `npx playwright test` against the real dev server)
- **Issue:** vite 8.0.16's Rolldown-based dev pre-bundler throws `init_runtime_dom_esm_bundler is not defined` when vue-router 5.1.0 is present, so the app never mounts in a real browser via `npm run dev` - blocking the entire smoke test task and, more importantly, meaning the real dev-server app was already broken independent of this plan.
- **Fix:** `npm install -D vite@7.3.6` (updates package.json + package-lock.json). This was flagged Rule 4 (architectural - project-wide dev/build tool change) in the prior session and routed to a human decision checkpoint; the user chose this exact fix. Executed here as the approved decision, not a fresh Rule 4 judgment call.
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm run dev` mounts the app correctly (no ReferenceError); `npx playwright test` passes; `npm run build` succeeds; `npm run test` (54/54 unit tests) passes; `npm run lint` passes.
- **Committed in:** `29adfb2` (own commit, separate from the Task 2 feature commit, per user's resume instructions)

**2. [Rule 1 - Bug] Smoke test targeted Vuetify's wrapper div instead of the actual `<input>`**
- **Found during:** Task 2 (first `npx playwright test` run after the vite downgrade)
- **Issue:** `page.getByTestId('city-search').fill(...)` failed with "Element is not an `<input>`..." because `data-testid` sits on Vuetify's outer `v-autocomplete` wrapper `<div>`, not the actual form control.
- **Fix:** Changed the locator to `page.getByTestId('city-search').locator('input')` for both `.click()` and `.fill()`.
- **Files modified:** e2e/smoke.spec.ts
- **Verification:** re-ran `npx playwright test` - search and card-appearance steps passed.
- **Committed in:** `9b14e6e` (part of the Task 2 commit)

**3. [Rule 3 - Blocking] Stale dev server on port 5173 caused a false "card click doesn't navigate" failure**
- **Found during:** Task 2 (second `npx playwright test` run, after fixing the input locator)
- **Issue:** `expect(page.getByTestId('forecast-list')).toBeVisible()` timed out after clicking the weather card - `playwright.config.ts`'s `reuseExistingServer: true` was reusing a stale `npm run dev` process (PID 6972) still listening on port 5173 from *before* the vite downgrade, serving the old, broken pre-bundle instead of a fresh one built with vite 7.3.6.
- **Fix:** Killed the stale process (`taskkill /F /PID 6972`) so Playwright's `webServer` block would start a fresh dev server with the downgraded vite.
- **Files modified:** none (environment cleanup only, not a code change)
- **Verification:** re-ran `npx playwright test` - full flow passed (`PASS (1) FAIL (0)`).
- **Committed in:** N/A (no file changes)

**4. [Rule 2 - Missing critical functionality] Vitest and Playwright test runners collided on `e2e/smoke.spec.ts`**
- **Found during:** Task 2 (running the full verification gate, `npm run test`)
- **Issue:** Vitest's default `include` glob (`**/*.spec.ts`) also matched the newly-created `e2e/smoke.spec.ts`, causing a hard crash: `Error: Playwright Test did not expect test() to be called here` - `npm run test` (the existing 54-test unit suite) could not run at all until this was fixed. This is essential test-infrastructure correctness, not a stylistic nice-to-have, so it's in scope per Rule 2.
- **Fix:** Added `exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**']` to `vitest.config.ts`'s `test` block.
- **Files modified:** vitest.config.ts
- **Verification:** `npm run test` - all 14 test files / 54 tests pass, e2e/smoke.spec.ts no longer picked up by Vitest.
- **Committed in:** `9b14e6e` (part of the Task 2 commit)

---

**Total deviations:** 4 (1 user-approved architectural dependency downgrade, 1 bug fix, 1 blocking-environment fix, 1 missing-critical-functionality fix)
**Impact on plan:** The vite downgrade is the only deviation with project-wide impact (affects the dev server and build tool for the whole app) - it was explicitly routed through a human decision checkpoint in the prior session and executed here exactly as approved. The other three were necessary for Task 2 and the plan's own verification gate to succeed, with no scope creep beyond what this plan's new files required.

## Issues Encountered
- The stale-dev-server issue (deviation 3) is worth flagging for future e2e work in this repo: `reuseExistingServer: true` in `playwright.config.ts` means any dev server left running from a prior manual investigation session will be silently reused, even after a dependency change that should invalidate it. No config change was made to address this (it is a one-off environment artifact of the debugging session, not a code defect), but future e2e sessions should confirm no stray `npm run dev` process is listening on port 5173 before trusting a "still broken" result during dependency-version investigations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TEST-06 is fully satisfied: `npx playwright test` passes the milestone-closing smoke flow against the real running app.
- This was the final plan of Phase 7 - all six phase requirements (GEO-01, STATE-04, WTHR-04, WTHR-05, DATA-06, TEST-06) are now fully implemented and independently verified.
- vite is now pinned to `^7.3.6` project-wide; any future Vite upgrade attempt should specifically re-test vue-router mounting in a real browser (not just `npm run build`/unit tests) before adopting a newer major version.

---
*Phase: 07-richer-weather-milestone-verification*
*Completed: 2026-07-09*

## Self-Check: PASSED

All claimed files and commits verified present:
- FOUND: playwright.config.ts
- FOUND: tsconfig.e2e.json
- FOUND: e2e/smoke.spec.ts
- FOUND: .planning/phases/07-richer-weather-milestone-verification/07-08-SUMMARY.md
- FOUND: commit 74ce714
- FOUND: commit 29adfb2
- FOUND: commit 9b14e6e
