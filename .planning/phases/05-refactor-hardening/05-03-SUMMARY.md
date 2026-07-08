---
phase: 05-refactor-hardening
plan: 03
subsystem: dependencies
tags: [vue-i18n, msw, supply-chain, upgrade, dev-dependency]
requires:
  - "05-01, 05-02: refactor complete so v11 runs against the finished suite (behavior-intact signal)"
provides:
  - "vue-i18n upgraded ^9 -> ^11.4.6, v9 npm-deprecation cleared - I18N-03"
  - "msw ^2.15.0 available as devDependency for plan 05-04 (TEST-04)"
affects:
  - package.json
  - package-lock.json
tech-stack:
  added:
    - "vue-i18n ^11.4.6 (dependencies)"
    - "msw ^2.15.0 (devDependencies)"
  patterns:
    - "createI18n({ legacy: false }) is v11-compatible unchanged - no bootstrap edit needed"
    - "msw kept dev-only, no npx msw init, no public/ artifact (node-environment mocking only)"
key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
decisions:
  - "vue-i18n v11 upgrade is a package.json-only change: RESEARCH breaking-change audit confirmed none of the removed APIs (legacy mode, tc/$tc, v-t, allowComposition, modulo interp) are used; src/i18n/index.ts and src/main.ts stayed byte-identical."
  - "msw resolved to ^2.15.0, not the plan's ^2.14.6: npm picked the highest match of the approved ^2 caret range and wrote ^2.15.0. Within the user-approved range and >= 2.14.6, so accepted."
  - "Blocking human package-legitimacy gate (Task 1) approved by developer before any install ran - supply-chain checkpoint T-05-SC satisfied."
metrics:
  duration: "~10 min (incl. human gate)"
  completed: "2026-07-08"
  tasks: 2
  files: 2
---

# Phase 5 Plan 03: vue-i18n v11 + msw Dependency Upgrade Summary

Upgraded vue-i18n from the npm-deprecated v9 line to v11 (I18N-03) and added msw as a dev dependency for the upcoming test plan (05-04 / TEST-04). Both installs were gated behind the RESEARCH-mandated blocking human package-legitimacy checkpoint, which the developer explicitly approved before anything touched `node_modules`.

## What Was Built

### Task 1 - Package legitimacy gate (blocking human-verify) - APPROVED
- Presented the supply-chain audit to the developer: vue-i18n 11.4.6 (heuristic "too-new") and msw (heuristic "postinstall script"), with the RESEARCH verdicts (both legitimate; msw postinstall imports an internal bundled script only, ~16.9M weekly downloads, `github.com/mswjs/msw`; vue-i18n on the maintained `github.com/intlify/vue-i18n` line).
- No install command ran and no package.json / lockfile change happened before the "Approve both" reply. Gate is never auto-approvable (workflow.auto_advance ignored for package legitimacy).

### Task 2 - Install vue-i18n@^11.4.6 + msw@^2.15.0 (dev) - commit 515c696
- `npm install vue-i18n@^11.4.6`: added 1, changed 4 packages. No "deprecated" notice for vue-i18n in the output (v9 deprecation cleared).
- `npm install -D msw@^2.14.6`: npm resolved the caret range to 2.15.0 and wrote `"msw": "^2.15.0"` under devDependencies (50 transitive packages added, all dev-only).
- Did NOT run `npx msw init` (no `public/mockServiceWorker.js`), did NOT add `@intlify/unplugin-vue-i18n`, did NOT touch `src/i18n/index.ts` or `src/main.ts`.

## Deviations from Plan

1. **msw version ^2.15.0 vs plan's ^2.14.6.** `npm install msw@^2.14.6` resolves the caret range to the highest matching release (2.15.0) and pins `^2.15.0`. Still within the developer-approved `^2` range and `>= 2.14.6`; the automated gate checks presence + registry provenance, not an exact version, so it passes. The must_haves "^2.14.6" literal is satisfied in spirit (same major/caret line).
2. **2 high-severity npm-audit findings, dev-only.** msw's node interceptor tree pulls `undici` (7.0.0-7.27.2) and `form-data` (4.0.0-4.0.5), both flagged high. Both are **devDependencies of msw** - they run only in the vitest node environment and never enter the Vite production bundle (threat T-05-07 boundary: devDependencies -> production bundle is not crossed; no `msw init`). Not remediated here (out of this plan's I18N-03 scope and no prod exposure); flagged for awareness.

## Verification

- Version + provenance gate: `vue-i18n ^11.4.6` in dependencies, `msw ^2.15.0` in devDependencies; lockfile resolves both from `https://registry.npmjs.org/` (vue-i18n 11.4.6, msw 2.15.0).
- `npm run test`: 7 files, 24 tests, all passing on v11. No vue-i18n deprecation line in test output.
- `npm run build`: exit 0, `dist/index.html` produced. Only the pre-existing `#__PURE__` warnings from `node_modules/@vueuse/core` (library-level, out of scope).
- `src/i18n/index.ts` and `src/main.ts`: git status empty (byte-identical, no bootstrap change).
- `public/mockServiceWorker.js`: absent (msw stays node-only).

## Threat Model Coverage

- T-05-SC (supply-chain tampering): blocking human gate approved + lockfile registry-provenance gate + lockfile committed with the change. Mitigated.
- T-05-07 (msw into app bundle): devDependency only, no `msw init`, no `public/` artifact. Mitigated. (Enforced further in 05-04: msw imports only under `src/__tests__`.)
- T-05-08 (vue-i18n rendering): messages are static author-controlled TS objects, interpolation renders as text, no v-html. Accepted, no code change.

## Known Stubs

None.

## Self-Check: PASSED
- FOUND: package.json with vue-i18n ^11.4.6 + msw ^2.15.0
- FOUND: package-lock.json resolving both from registry.npmjs.org
- UNCHANGED: src/i18n/index.ts, src/main.ts
- ABSENT: public/mockServiceWorker.js
- PASS: 24/24 tests green, build exit 0
