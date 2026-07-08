# Phase 5: Refactor & Hardening - Pattern Map

**Mapped:** 2026-07-08
**Files analyzed:** 15 new/modified files
**Analogs found:** 13 / 15

Note: this is a refactor phase, so for most files the "analog" IS the file being modified - the pattern map records exactly which lines change, which lines to keep, and which existing conventions (teaching comments, i18n key parity, test harness shims) new code must copy.

## File Classification

| New/Modified File | Change | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/composables/useForecast.ts` | modify (DATA-04) | composable | request-response (query) | itself + RESEARCH Code Example 1 | exact |
| `src/composables/useCurrentWeather.ts` | modify (DATA-04) | composable | request-response (query) | `src/composables/useForecast.ts` (same shape, edited first) | exact |
| `src/pages/CityDetailPage.vue` | modify (DATA-04, DATA-05) | page | request-response | itself (delete Proxy hack, keep template structure) | exact |
| `src/components/WeatherCard.vue` | modify (DATA-05, WTHR-03) | component | request-response | itself | exact |
| `src/components/CitySearch.vue` | modify (SRCH-04) | component | debounced request-response | itself (keep suppressSearch/resetField logic) | exact |
| `src/router/index.ts` | modify (NAV-04/05) | config (router) | request-response | itself | exact |
| `src/pages/NotFoundPage.vue` | NEW (NAV-05) | page | static render | `CityDetailPage.vue` not-found branch (lines 61-69) | exact |
| `src/i18n/messages/en.ts` | modify | config (messages) | - | itself | exact |
| `src/i18n/messages/ja.ts` | modify | config (messages) | - | itself | exact |
| `src/i18n/index.ts` | verify-only (I18N-03) | config (plugin) | - | itself (expected unchanged) | exact |
| `src/main.ts` | verify-only (I18N-03) | bootstrap | - | itself (expected unchanged) | exact |
| `package.json` | modify (I18N-03, TEST-04) | config | - | - | n/a |
| `src/__tests__/openMeteo.spec.ts` | NEW (TEST-04) | test (node env, MSW) | HTTP boundary | none - first MSW test | no analog (use RESEARCH Code Example 5) |
| `src/__tests__/citySearch.spec.ts` | NEW (TEST-05) | test (jsdom, component) | request-response | `src/__tests__/cityDetail.spec.ts` | exact |
| `src/__tests__/msw/handlers.ts` | NEW optional (TEST-04) | test util | - | none | no analog |
| `vitest.config.ts` | likely unchanged | config | - | itself | exact |

## Pattern Assignments

### `src/composables/useForecast.ts` + `useCurrentWeather.ts` (composables, DATA-04)

**Analog:** the files themselves. Current shape (`useForecast.ts` lines 1-18):

```typescript
import { useQuery } from '@tanstack/vue-query'

import { fetchForecast } from '@/lib/openMeteo'
import type { SavedCity } from '@/types/weather'

// Vue Query = server state: it owns loading/error/cache/refetch for a city's multi-day
// forecast. Keyed by city.key so each city caches independently...
export function useForecast(city: SavedCity) {
  return useQuery({
    queryKey: ['forecast', city.key],
    // signal comes from Vue Query so superseded/unmounted fetches abort.
    queryFn: ({ signal }) => fetchForecast(city.latitude, city.longitude, 7, signal),
    // 5 min: revisiting a city does not refetch immediately - shows the cache working.
    staleTime: 5 * 60 * 1000,
  })
}
```

**Rework target** (RESEARCH.md Code Example 1, verified against installed Vue Query 5.101.0 types):

```typescript
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'

export function useForecast(city: MaybeRefOrGetter<SavedCity | undefined>) {
  return useQuery({
    queryKey: computed(() => ['forecast', toValue(city)?.key]),
    queryFn: ({ signal }) => {
      const c = toValue(city)
      if (!c) throw new Error('useForecast: query must stay disabled without a city')
      return fetchForecast(c.latitude, c.longitude, 7, signal)
    },
    enabled: computed(() => !!toValue(city)),
    staleTime: 5 * 60 * 1000,
  })
}
```

**Conventions to preserve:**
- Import order: vue -> library -> `@/lib` -> `@/types` (matches every existing file).
- Teaching comments on every non-obvious line ("Vue Query = server state...", "signal comes from Vue Query..."). Update the comments to explain `enabled` + `toValue` - this is the study-project convention in ALL src files.
- Keep `staleTime: 5 * 60 * 1000` and the query key roots `'forecast'` / `'currentWeather'` unchanged (cache identity).
- `useCurrentWeather.ts` is byte-for-byte the same pattern with `fetchCurrentWeather(c.latitude, c.longitude, signal)` and key `['currentWeather', toValue(city)?.key]`.

---

### `src/pages/CityDetailPage.vue` (page, DATA-04 + DATA-05)

**Analog:** itself.

**DELETE** the Proxy hack (lines 34-53): the `queryCity` ref with the `{ latitude: 0, longitude: 0 }` sentinel, the `watch`, and the `new Proxy(...)` argument. Also drop now-unused imports `watch`, `ref`, `Ref` from line 2.

**KEEP** the `city` computed (lines 21-24) and pass it straight in - it is already the reactive source DATA-04 wants:

```typescript
const city = computed<SavedCity | undefined>(() => {
  const id = String(route.params.id)
  return store.cities.find((c) => String(c.id) === id || c.key === id)
})
// after refactor, plus refetch for DATA-05:
const { data, isPending, isError, refetch } = useForecast(city)
```

**Retry button (DATA-05)** goes in the existing error branch (line 80):

```vue
<v-alert v-else-if="isError" type="error" variant="tonal" density="compact">
  {{ t('detail.loadError') }}
  <template #append>
    <v-btn size="small" variant="text" @click="refetch()">{{ t('detail.retry') }}</v-btn>
  </template>
</v-alert>
```

**KEEP** the in-page not-found branch (lines 61-69) - it handles "known route, unknown saved city", distinct from the router 404.

---

### `src/components/WeatherCard.vue` (component, WTHR-03 + DATA-05)

**Analog:** itself.

**DELETE (WTHR-03)** the dead 404 branch, lines 33-41, plus `import { isAxiosError } from 'axios'` (line 3):

```typescript
// Distinguish "city not found" (404) from a network/other failure (D-08). Never render
// the raw error object.
const errorMessage = computed(() => {
  const e = error.value
  if (isAxiosError(e) && e.response?.status === 404) {
    return t('card.notFound')
  }
  return t('card.loadError')
})
```
Replace `{{ errorMessage }}` in the template (line 74) with `{{ t('card.loadError') }}` and drop `error` from the destructure on line 22.

**Reactive prop (DATA-04 pitfall 2):** line 22 currently snapshots the prop - change to a getter:

```typescript
// before: const { data, isPending, isError, error } = useCurrentWeather(props.city)
const { data, isPending, isError, refetch } = useCurrentWeather(() => props.city)
```

**Retry button (DATA-05)** in the error alert (line 73). IMPORTANT: the card root is a router-link `v-card` (line 52), so copy the existing `@click.stop` convention from the remove button (line 63) and add `.prevent`:

```vue
<v-alert v-else-if="isError" type="error" variant="tonal" density="compact">
  {{ t('card.loadError') }}
  <template #append>
    <v-btn size="small" variant="text" @click.stop.prevent="refetch()">
      {{ t('card.retry') }}
    </v-btn>
  </template>
</v-alert>
```

---

### `src/components/CitySearch.vue` (component, SRCH-04)

**Analog:** itself. Only the timer mechanics change.

**KEEP unchanged:** yup schema (lines 19-24), `useField` with `validateOnValueUpdate: false` (lines 28-30), the `suppressSearch` echo guard, the empty-input `resetField()` early return (lines 44-58), `onSelect` (lines 82-91), `cityTitle`, and the whole template (`@update:search="onSearch"` contract at line 113 - the tests depend on it).

**REPLACE** lines 36 + 59-77 (`let debounceId ...` and the `setTimeout` body) with `useDebounceFn` + manual cleanup (RESEARCH Code Example 4; verified: installed VueUse 14.3.0 returns a bare promisified fn, NO `.cancel()`, NO auto-cleanup):

```typescript
import { onScopeDispose, ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

let controller: AbortController | undefined
// Manual unmount cleanup: the debounce timer can still fire after unmount
// (useDebounceFn has no cancel), so flag disposal and abort in-flight work.
let disposed = false
onScopeDispose(() => {
  disposed = true
  controller?.abort()
})

const debouncedGeocode = useDebounceFn(async (text: string) => {
  if (disposed) return
  const result = await validate()
  if (!result.valid) {
    items.value = []
    return
  }
  controller?.abort() // abort-on-new-input: only the latest term resolves
  controller = new AbortController()
  loading.value = true
  try {
    items.value = await geocodeCity(text, controller.signal)
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}, 300)
```

Inside `onSearch`, the tail becomes `debouncedGeocode(text)`. Update the teaching comment at lines 42-43 ("hand-rolled - no lodash") to name `useDebounceFn`.

---

### `src/router/index.ts` (router config, NAV-04/05)

**Analog:** itself (lines 1-18). Rework: drop the three static page imports, switch each `component:` to `() => import('@/pages/X.vue')`, append the catch-all LAST:

```typescript
{ path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue') },
```

Keep both `export const router` and `export default router` (tests import the default: `import router from '@/router'`). Keep/update the teaching comment block. Verify with `npm run build`: one `dist/assets/<Page>-[hash].js` chunk per page.

---

### `src/pages/NotFoundPage.vue` (NEW page, NAV-05)

**Analog:** `src/pages/CityDetailPage.vue` not-found branch, lines 61-69 - copy structure, classes, and i18n usage verbatim style:

```vue
<template>
  <section class="pa-4">
    <h1 class="text-h4 mb-2">{{ t('notFound.title') }}</h1>
    <p class="mb-4 text-medium-emphasis">{{ t('notFound.body') }}</p>
    <v-btn :to="{ name: 'dashboard' }" color="primary" prepend-icon="mdi-arrow-left">
      {{ t('notFound.backToDashboard') }}
    </v-btn>
  </section>
</template>
```

Script: `<script setup lang="ts">` + `const { t } = useI18n()` + a teaching comment explaining the catch-all route. Security note from RESEARCH: do NOT render `route.params.pathMatch`.

---

### `src/i18n/messages/en.ts` + `ja.ts` (i18n keys)

**Analog:** themselves. Hard convention: en/ja key parity - every add/delete happens in BOTH files.

- **DELETE** `card.notFound` (en.ts line 40, ja.ts line 27) - only WeatherCard used it (verified by grep).
- **ADD** `card.retry`, `detail.retry`, and a `notFound: { title, body, backToDashboard }` section. Style analog for the retry copy: short imperative like existing `detail.backToDashboard` ('Back to dashboard' / 'ダッシュボードに戻る'). Existing not-found copy to adapt: `detail.notFoundTitle`/`notFoundBody` (en.ts lines 48-49, ja.ts lines 35-36).

---

### `src/i18n/index.ts` + `src/main.ts` (I18N-03 vue-i18n v9 -> v11)

**Analog:** themselves - expected UNCHANGED. `src/i18n/index.ts` uses `createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en, ja } })` (lines 38-45) and `main.ts` does `.use(i18n)` (line 21); both are v11-compatible as-is. The change is `package.json` only: `vue-i18n@^11.4.6` (human-verify checkpoint before install per RESEARCH package audit; confirm resolves to `intlify/vue-i18n`). Verification = full test suite green + no "deprecated" in install output + no dev-console deprecation warning.

---

### `src/__tests__/citySearch.spec.ts` (NEW test, TEST-05)

**Analog:** `src/__tests__/cityDetail.spec.ts` - copy the harness wholesale:

**Module mock pattern** (lines 20-35) - mock ALL exports of `@/lib/openMeteo`, but let `geocodeCity` be the interesting one:

```typescript
vi.mock('@/lib/openMeteo', () => ({
  geocodeCity: vi.fn().mockResolvedValue([]),
  fetchCurrentWeather: vi.fn(),
  fetchForecast: vi.fn(),
}))
```

**Vuetify jsdom shims** (lines 49-70) - copy the `beforeAll` ResizeObserver + matchMedia no-op shim block verbatim.

**Mount pattern** (lines 76-94): fresh `createPinia()` per test in `beforeEach` with `setActivePinia(pinia)`; `createVuetify({ components, directives })`; `global.plugins: [vuetify, pinia, i18n]` (no router/VueQuery needed - CitySearch uses neither). Mount `CitySearch` directly, not `App`.

**New pieces on top of the analog** (RESEARCH Code Example 6): `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`; drive the component via `wrapper.findComponent({ name: 'VAutocomplete' }).vm.$emit('update:search', 'Lond')`; assert after `await vi.advanceTimersByTimeAsync(300)` + `await flushPromises()`. Abort test: capture `vi.mocked(geocodeCity).mock.calls[0][1]` (the AbortSignal) and assert `.aborted === true` after a second debounced search. Select test: `$emit('update:model-value', geoCity)` then assert store + cleared field.

---

### `src/__tests__/openMeteo.spec.ts` (NEW test, TEST-04) - NO codebase analog

No existing test hits real HTTP; every spec uses `vi.mock`. Use RESEARCH Code Example 5 as the template instead:

- First line docblock: `// @vitest-environment node` (overrides jsdom from `vitest.config.ts` line 16; config file itself needs no change).
- MSW v2 syntax only: `import { http, HttpResponse } from 'msw'`, `setupServer` from `msw/node`.
- Lifecycle: `beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())`.
- URLs to intercept come from `src/lib/openMeteo.ts` lines 9-10: `https://geocoding-api.open-meteo.com/v1/search` and `https://api.open-meteo.com/v1/forecast`.
- Shapes to assert (from `openMeteo.ts`): `geocodeCity` returns `[]` when `results` is absent (line 44 `?? []`); success responses are normalized snake_case -> camelCase (`temperature_2m` -> `temperature`, `daily.time` -> `dates`, etc. - lines 63-69, 93-99); errors are raw axios rejections (`{ response: { status } }`).
- Copy the codebase test-file comment style: an explanatory comment above the mock/setup blocks (see cityDetail.spec.ts lines 16-19).
- `msw` install gated behind human-verify checkpoint (RESEARCH package audit); dev dependency only; never run `npx msw init`.

`src/__tests__/msw/handlers.ts` is optional - only extract shared happy-path handlers if both directions need them; per-test `server.use()` overrides are the default pattern.

## Shared Patterns

### Teaching comments (project-wide convention)
**Source:** every file read (e.g. `useForecast.ts` lines 6-9, `openMeteo.ts` lines 5-7, `i18n/index.ts` lines 8-14)
**Apply to:** ALL new and modified code. Every non-obvious decision gets a "why" comment naming the library's role ("Vue Query = server state", "axios = the HTTP layer"). Use "-", never the em-dash character.

### i18n usage in components
**Source:** `WeatherCard.vue` lines 4, 16; `CityDetailPage.vue` lines 4, 17
**Apply to:** NotFoundPage.vue, retry buttons
```typescript
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
```
All user-facing strings via `t('section.key')`; keys added to BOTH en.ts and ja.ts.

### Error display pattern
**Source:** `CityDetailPage.vue` line 80, `WeatherCard.vue` line 73
**Apply to:** both retry buttons - keep the exact alert shell:
```vue
<v-alert v-else-if="isError" type="error" variant="tonal" density="compact">
```
Generic message, never the raw error object.

### Test harness (jsdom component tests)
**Source:** `src/__tests__/cityDetail.spec.ts` lines 49-94
**Apply to:** citySearch.spec.ts and any Phase 5 test touching Vuetify components: ResizeObserver/matchMedia shims, fresh Pinia per test, plugin array on `mount`, `flushPromises` (twice if flaky - Pitfall 8 after lazy routes).

### AbortSignal threading
**Source:** `src/lib/openMeteo.ts` (every fetch takes `signal?: AbortSignal`)
**Apply to:** composables (Vue Query's queryFn `{ signal }`) and CitySearch (its own AbortController). Already established; preserve through both refactors.

## No Analog Found

| File | Role | Data Flow | Reason | Fallback |
|------|------|-----------|--------|----------|
| `src/__tests__/openMeteo.spec.ts` | test | HTTP boundary | No MSW / real-HTTP tests exist; all specs use `vi.mock` | RESEARCH.md Code Example 5 (verified against mswjs.io docs) |
| `src/__tests__/msw/handlers.ts` | test util | - | First MSW artifact | Extract only if reuse emerges |

## Regression Watch (existing tests affected)

- `navigation.spec.ts`, `cityDetail.spec.ts`, `settingsPage.spec.ts` mount App with the real router; lazy routes add a microtask (Pitfall 8) - they already `await router.isReady()` + `flushPromises()`, run full suite after the router change.
- `cityDetail.spec.ts` exercises the CityDetailPage refactor end-to-end - it must stay green with zero edits (proves DATA-04 preserved behavior).

## Metadata

**Analog search scope:** src/composables, src/pages, src/components, src/router, src/i18n (+ messages), src/lib, src/__tests__, vitest.config.ts, main.ts
**Files scanned:** 13 read in full, 2 grepped (en.ts/ja.ts key locations)
**Pattern extraction date:** 2026-07-08
