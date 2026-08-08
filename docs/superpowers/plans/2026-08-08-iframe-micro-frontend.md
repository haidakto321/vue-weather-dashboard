# iframe + Micro-Frontend Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two `<iframe>` demos to the Vue Weather Dashboard - a simple OpenStreetMap embed on the city detail page, and a genuinely separate mini Vue project (own dev server, own `package.json`) that talks to the main app over `postMessage` to set a "default location" and warn about tomorrow's rain.

**Architecture:** Two independent additions. (1) A pure URL-builder + presentational component embeds OSM's public embed endpoint - no messaging, no new state. (2) A second, standalone Vite+Vue project lives at `widgets/default-location-widget/`, loaded via `<iframe>` from a new `DefaultLocationWidget.vue` in the main app. The two sides exchange three message types (`widget:ready`, `widget:init`, `widget:set-default`) over `window.postMessage`, each side validating `event.origin` before trusting a payload. A new `defaultCityKey` field on the existing `preferences` Pinia store is the single place that state lands.

**Tech Stack:** Vue 3 + TypeScript + Vite (existing app), Pinia, vue-i18n, Vuetify, Vitest + @vue/test-utils (existing test stack). The widget project reuses Vue 3 + TypeScript + Vite only - no Vuetify, no Pinia, no vue-i18n (deliberately bare, see spec).

## Global Constraints

- Tech stack fixed: Vue 3 + TypeScript + Vite. No new frontend framework.
- Data source: Open-Meteo public API only, no API key, for both the main app and the widget.
- Existing test convention: flat spec files in `src/__tests__/*.spec.ts` (not colocated `.test.ts`), Vitest + `@vue/test-utils`.
- `src/i18n/messages/en.ts` and `ja.ts` MUST keep identical key shape - `src/__tests__/i18nParity.spec.ts` enforces this. Every new UI string in the main app needs a key in both files.
- User has explicitly waived the CLAUDE.md "ask before adding scope/dependencies" constraint for this work.
- No git commit unless the user explicitly asks in this session (CLAUDE.md, first-priority rule) - stage nothing beyond what each task's commit step says, and only run those commits if the user has asked for commits this session.

---

### Task 1: OpenStreetMap embed on the city detail page

**Files:**
- Create: `src/lib/osmEmbed.ts`
- Create: `src/components/LocationMap.vue`
- Create: `src/__tests__/osmEmbed.spec.ts`
- Modify: `src/pages/CityDetailPage.vue` (insert map card + import)
- Modify: `src/i18n/messages/en.ts` (add `detail.mapHeading`)
- Modify: `src/i18n/messages/ja.ts` (add `detail.mapHeading`)

**Interfaces:**
- Produces: `buildOsmEmbedUrl(lat: number, lon: number): string` — exported from `src/lib/osmEmbed.ts`.
- Produces: `LocationMap.vue` — props `{ latitude: number; longitude: number; name: string }`, no emits.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/osmEmbed.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'

import { buildOsmEmbedUrl } from '@/lib/osmEmbed'

describe('buildOsmEmbedUrl', () => {
  it('builds a bbox centered on the point with a matching marker (London)', () => {
    const url = buildOsmEmbedUrl(51.5085, -0.1257)
    expect(url).toBe(
      'https://www.openstreetmap.org/export/embed.html?bbox=-0.1757,51.4585,-0.0757,51.5585&layer=mapnik&marker=51.5085,-0.1257',
    )
  })

  it('handles the 0,0 origin point without a malformed bbox', () => {
    const url = buildOsmEmbedUrl(0, 0)
    expect(url).toBe(
      'https://www.openstreetmap.org/export/embed.html?bbox=-0.0500,-0.0500,0.0500,0.0500&layer=mapnik&marker=0.0000,0.0000',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- osmEmbed`
Expected: FAIL with "Cannot find module '@/lib/osmEmbed'" (or similar - the file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/osmEmbed.ts`:

```ts
// Builds an OpenStreetMap "export/embed" URL centered on a point. A fixed +/-0.05 degree
// box keeps the zoom level roughly consistent across cities without calling any geocoding
// or tile-size API - this is a pure, offline URL builder.
const BBOX_DELTA_DEGREES = 0.05

export function buildOsmEmbedUrl(lat: number, lon: number): string {
  const latMin = (lat - BBOX_DELTA_DEGREES).toFixed(4)
  const latMax = (lat + BBOX_DELTA_DEGREES).toFixed(4)
  const lonMin = (lon - BBOX_DELTA_DEGREES).toFixed(4)
  const lonMax = (lon + BBOX_DELTA_DEGREES).toFixed(4)
  const bbox = `${lonMin},${latMin},${lonMax},${latMax}`
  const marker = `${lat.toFixed(4)},${lon.toFixed(4)}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- osmEmbed`
Expected: PASS (2 tests).

- [ ] **Step 5: Create the presentational component**

Create `src/components/LocationMap.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'

import { buildOsmEmbedUrl } from '@/lib/osmEmbed'

const props = defineProps<{
  latitude: number
  longitude: number
  name: string
}>()

const embedUrl = computed(() => buildOsmEmbedUrl(props.latitude, props.longitude))
</script>

<template>
  <iframe
    :src="embedUrl"
    :title="`Map of ${props.name}`"
    style="width: 100%; height: 300px; border: none"
    data-testid="location-map"
  />
</template>
```

- [ ] **Step 6: Add the i18n key to both locales**

In `src/i18n/messages/en.ts`, inside the `detail:` block (after `hourlyHeading`), add:

```ts
    hourlyHeading: 'Hourly forecast',
    mapHeading: 'Location map',
```

In `src/i18n/messages/ja.ts`, inside the `detail:` block (after `hourlyHeading`), add:

```ts
    hourlyHeading: '時間ごとの予報',
    mapHeading: '地図',
```

- [ ] **Step 7: Mount it on the city detail page**

In `src/pages/CityDetailPage.vue`, add the import alongside the other component imports:

```ts
import LocationMap from '@/components/LocationMap.vue'
```

Then insert this block right after the closing `</v-card>` of the current-conditions panel
(the `v-card` with `data-testid="current-conditions"`) and before the `<v-row>` that holds
the forecast list/chart:

```html
        <h2 class="text-h6 mb-2">{{ t('detail.mapHeading') }}</h2>
        <LocationMap :latitude="city.latitude" :longitude="city.longitude" :name="displayName" class="mb-4" />
```

- [ ] **Step 8: Run the full test suite to confirm nothing broke**

Run: `npm run test`
Expected: PASS (all existing suites, including `cityDetail.spec.ts` and `i18nParity.spec.ts`, still green).

- [ ] **Step 9: Manual check**

Run `npm run dev`, open a saved city's detail page, confirm the "Location map" heading and an
OpenStreetMap iframe render with a marker roughly at the city's coordinates.

- [ ] **Step 10: Commit** (only if the user has asked for commits this session)

```bash
git add src/lib/osmEmbed.ts src/components/LocationMap.vue src/__tests__/osmEmbed.spec.ts src/pages/CityDetailPage.vue src/i18n/messages/en.ts src/i18n/messages/ja.ts
git commit -m "feat: embed OpenStreetMap on the city detail page"
```

---

### Task 2: `defaultCityKey` on the preferences store

**Files:**
- Modify: `src/types/preferences.ts`
- Modify: `src/stores/preferences.ts`
- Modify: `src/__tests__/preferences.store.spec.ts`

**Interfaces:**
- Produces: `usePreferencesStore().defaultCityKey: ComputedRef<string | null>`.
- Produces: `usePreferencesStore().setDefaultCity(key: string | null): void`.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Write the failing tests**

Append to `src/__tests__/preferences.store.spec.ts` (inside the existing `describe` block, after
the last `it`):

```ts
  it('starts with defaultCityKey null', () => {
    const store = usePreferencesStore()
    expect(store.defaultCityKey).toBeNull()
  })

  it('setDefaultCity updates and persists the default city key', () => {
    const store = usePreferencesStore()
    store.setDefaultCity('2643743')
    expect(store.defaultCityKey).toBe('2643743')
    const raw = localStorage.getItem('weather-prefs')
    const stored = JSON.parse(raw as string)
    expect(stored.defaultCityKey).toBe('2643743')
  })

  it('falls back to null when localStorage holds a non-string defaultCityKey', () => {
    localStorage.setItem(
      'weather-prefs',
      JSON.stringify({
        unit: 'celsius',
        theme: 'light',
        language: 'en',
        windUnit: 'kmh',
        defaultCityKey: 123,
      }),
    )
    const store = usePreferencesStore()
    expect(store.defaultCityKey).toBeNull()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- preferences.store`
Expected: FAIL - `store.defaultCityKey` is `undefined`, not `null`; `setDefaultCity` is not a
function.

- [ ] **Step 3: Add the field to the type contract**

In `src/types/preferences.ts`, add to the `Preferences` interface:

```ts
export interface Preferences {
  unit: TemperatureUnit
  windUnit: WindUnit
  theme: ThemeMode
  language: Language
  defaultCityKey: string | null
}
```

And to `DEFAULT_PREFERENCES`:

```ts
export const DEFAULT_PREFERENCES: Preferences = {
  unit: 'celsius',
  windUnit: 'kmh',
  theme: 'light',
  language: 'en',
  defaultCityKey: null,
}
```

- [ ] **Step 4: Wire the store**

In `src/stores/preferences.ts`, add to the `sanitize()` return object:

```ts
    defaultCityKey:
      typeof source.defaultCityKey === 'string' || source.defaultCityKey === null
        ? source.defaultCityKey
        : DEFAULT_PREFERENCES.defaultCityKey,
```

Add the getter (near the other `computed` getters):

```ts
  const defaultCityKey = computed(() => prefs.value.defaultCityKey)
```

Add the setter (near the other setters):

```ts
  function setDefaultCity(key: string | null) {
    prefs.value.defaultCityKey = key
  }
```

Add both to the returned object:

```ts
  return {
    unit,
    windUnit,
    theme,
    language,
    defaultCityKey,
    setUnit,
    setWindUnit,
    setTheme,
    setLanguage,
    setDefaultCity,
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- preferences.store`
Expected: PASS (all cases, including the 3 new ones).

- [ ] **Step 6: Run the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 7: Commit** (only if the user has asked for commits this session)

```bash
git add src/types/preferences.ts src/stores/preferences.ts src/__tests__/preferences.store.spec.ts
git commit -m "feat: add defaultCityKey to the preferences store"
```

---

### Task 3: Trusted-origin helper + shared message types (main app)

**Files:**
- Create: `src/lib/widgetMessages.ts`
- Create: `src/types/widgetMessages.ts`
- Create: `src/__tests__/widgetMessages.spec.ts`

**Interfaces:**
- Produces: `isTrustedOrigin(origin: string, allowed: string): boolean` from `src/lib/widgetMessages.ts`.
- Produces: types `SavedCityLite`, `WidgetInitMessage`, `WidgetToParentMessage` from `src/types/widgetMessages.ts`.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/widgetMessages.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'

import { isTrustedOrigin } from '@/lib/widgetMessages'

describe('isTrustedOrigin', () => {
  it('returns true when the origin exactly matches the allowed origin', () => {
    expect(isTrustedOrigin('http://localhost:5174', 'http://localhost:5174')).toBe(true)
  })

  it('returns false for a different origin', () => {
    expect(isTrustedOrigin('http://evil.example', 'http://localhost:5174')).toBe(false)
  })

  it('returns false for a matching host on a different port', () => {
    expect(isTrustedOrigin('http://localhost:9999', 'http://localhost:5174')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- widgetMessages`
Expected: FAIL with "Cannot find module '@/lib/widgetMessages'".

- [ ] **Step 3: Write the implementation**

Create `src/lib/widgetMessages.ts`:

```ts
// Exact-match origin check for postMessage handlers on both sides of the
// main-app <-> widget iframe boundary. No wildcard/prefix matching - an
// exact string match is the only safe way to validate a postMessage origin.
export function isTrustedOrigin(origin: string, allowed: string): boolean {
  return origin === allowed
}
```

Create `src/types/widgetMessages.ts`:

```ts
// Message contract for the main app <-> default-location-widget iframe boundary.
// The widget project (widgets/default-location-widget/) mirrors these shapes locally
// rather than importing them - the two projects intentionally don't share code.

export interface SavedCityLite {
  key: string
  name: string
  latitude: number
  longitude: number
  admin1?: string
  country?: string
}

export interface WidgetReadyMessage {
  type: 'widget:ready'
}

export interface WidgetSetDefaultMessage {
  type: 'widget:set-default'
  cityKey: string
}

export type WidgetToParentMessage = WidgetReadyMessage | WidgetSetDefaultMessage

export interface WidgetInitMessage {
  type: 'widget:init'
  cities: SavedCityLite[]
  defaultCityKey: string | null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- widgetMessages`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit** (only if the user has asked for commits this session)

```bash
git add src/lib/widgetMessages.ts src/types/widgetMessages.ts src/__tests__/widgetMessages.spec.ts
git commit -m "feat: add postMessage origin-check helper and message types"
```

---

### Task 4: `DefaultLocationWidget.vue` (main-app side of the iframe)

**Files:**
- Create: `src/components/DefaultLocationWidget.vue`
- Create: `src/__tests__/defaultLocationWidget.spec.ts`
- Modify: `src/pages/DashboardPage.vue` (mount the component)
- Modify: `src/i18n/messages/en.ts` (add `dashboard.widgetHeading`)
- Modify: `src/i18n/messages/ja.ts` (add `dashboard.widgetHeading`)

**Interfaces:**
- Consumes: `isTrustedOrigin` from Task 3 (`@/lib/widgetMessages`); `SavedCityLite`,
  `WidgetInitMessage` from Task 3 (`@/types/widgetMessages`); `defaultCityKey`,
  `setDefaultCity` from Task 2 (`@/stores/preferences`); existing `useCitiesStore().cities`.
- Produces: `DefaultLocationWidget.vue`, no props, no emits - self-contained.
- The widget's default URL is `http://localhost:5174` (matches the widget project's dev port
  set up in Task 6), overridable via `VITE_WIDGET_URL`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/defaultLocationWidget.spec.ts`:

```ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia, type Pinia } from 'pinia'

import DefaultLocationWidget from '@/components/DefaultLocationWidget.vue'
import { i18n } from '@/i18n'
import { useCitiesStore } from '@/stores/cities'
import { usePreferencesStore } from '@/stores/preferences'

// jsdom does not implement ResizeObserver and ships only a partial matchMedia, both of
// which Vuetify touches. Same shim as the other Vuetify component specs.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.matchMedia =
    globalThis.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false
        },
      }) as unknown as MediaQueryList)
})

// Matches the component's fallback default (no VITE_WIDGET_URL set in the test env).
const WIDGET_ORIGIN = 'http://localhost:5174'

let pinia: Pinia

function mountWidget() {
  const vuetify = createVuetify({ components, directives })
  return mount(DefaultLocationWidget, {
    global: { plugins: [vuetify, pinia, i18n] },
  })
}

function dispatchMessage(origin: string, data: unknown) {
  window.dispatchEvent(new MessageEvent('message', { origin, data }))
}

describe('DefaultLocationWidget', () => {
  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)

    useCitiesStore().addCity({
      id: 2643743,
      name: 'London',
      latitude: 51.5085,
      longitude: -0.1257,
      country: 'United Kingdom',
      admin1: 'England',
    })
  })

  it('ignores a widget:set-default message from an untrusted origin', () => {
    mountWidget()
    const prefs = usePreferencesStore()

    dispatchMessage('http://evil.example', { type: 'widget:set-default', cityKey: '2643743' })

    expect(prefs.defaultCityKey).toBeNull()
  })

  it('sets the default city on a trusted message referencing a known city', () => {
    mountWidget()
    const prefs = usePreferencesStore()

    dispatchMessage(WIDGET_ORIGIN, { type: 'widget:set-default', cityKey: '2643743' })

    expect(prefs.defaultCityKey).toBe('2643743')
  })

  it('rejects a trusted message referencing an unknown city key', () => {
    mountWidget()
    const prefs = usePreferencesStore()

    dispatchMessage(WIDGET_ORIGIN, { type: 'widget:set-default', cityKey: 'does-not-exist' })

    expect(prefs.defaultCityKey).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- defaultLocationWidget`
Expected: FAIL with "Cannot find module '@/components/DefaultLocationWidget.vue'".

- [ ] **Step 3: Write the implementation**

Create `src/components/DefaultLocationWidget.vue`:

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { isTrustedOrigin } from '@/lib/widgetMessages'
import { useCitiesStore } from '@/stores/cities'
import { usePreferencesStore } from '@/stores/preferences'
import type { SavedCityLite, WidgetInitMessage } from '@/types/widgetMessages'

const citiesStore = useCitiesStore()
const preferencesStore = usePreferencesStore()
const { t } = useI18n()

// Falls back to the widget project's fixed dev port (Task 6) so this works with zero
// setup; VITE_WIDGET_URL overrides it if the widget is ever served elsewhere.
const widgetUrl = (import.meta.env.VITE_WIDGET_URL as string | undefined) ?? 'http://localhost:5174'
const widgetOrigin = new URL(widgetUrl).origin

const iframeRef = ref<HTMLIFrameElement | null>(null)

function toLite(cities: { key: string; name: string; latitude: number; longitude: number; admin1?: string; country?: string }[]): SavedCityLite[] {
  return cities.map((c) => ({
    key: c.key,
    name: c.name,
    latitude: c.latitude,
    longitude: c.longitude,
    admin1: c.admin1,
    country: c.country,
  }))
}

function handleMessage(event: MessageEvent) {
  if (!isTrustedOrigin(event.origin, widgetOrigin)) return

  const data = event.data as { type?: unknown; cityKey?: unknown } | null
  if (!data || typeof data.type !== 'string') return

  if (data.type === 'widget:ready') {
    const initMessage: WidgetInitMessage = {
      type: 'widget:init',
      cities: toLite(citiesStore.cities),
      defaultCityKey: preferencesStore.defaultCityKey,
    }
    iframeRef.value?.contentWindow?.postMessage(initMessage, widgetOrigin)
    return
  }

  if (data.type === 'widget:set-default' && typeof data.cityKey === 'string') {
    const exists = citiesStore.cities.some((c) => c.key === data.cityKey)
    if (exists) preferencesStore.setDefaultCity(data.cityKey)
  }
}

onMounted(() => window.addEventListener('message', handleMessage))
onUnmounted(() => window.removeEventListener('message', handleMessage))
</script>

<template>
  <v-card class="mb-4">
    <v-card-title>{{ t('dashboard.widgetHeading') }}</v-card-title>
    <v-card-text class="pa-0">
      <iframe
        ref="iframeRef"
        :src="widgetUrl"
        title="Default location widget"
        sandbox="allow-scripts allow-same-origin"
        style="width: 100%; height: 220px; border: none"
        data-testid="default-location-widget-frame"
      />
    </v-card-text>
  </v-card>
</template>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- defaultLocationWidget`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the i18n key to both locales**

In `src/i18n/messages/en.ts`, inside the `dashboard:` block, add:

```ts
  dashboard: {
    heading: 'Dashboard',
    emptyState: 'Search for a city to see its current weather.',
    widgetHeading: 'Default location',
  },
```

In `src/i18n/messages/ja.ts`, inside the `dashboard:` block, add:

```ts
  dashboard: {
    heading: 'ダッシュボード',
    emptyState: '都市を検索して現在の天気を表示します。',
    widgetHeading: 'デフォルトの場所',
  },
```

- [ ] **Step 6: Mount it on the dashboard**

In `src/pages/DashboardPage.vue`, add the import:

```ts
import DefaultLocationWidget from '@/components/DefaultLocationWidget.vue'
```

Add it to the template, between `<GeolocationButton class="mb-4" />` and the empty-state
`v-sheet`:

```html
    <GeolocationButton class="mb-4" />

    <DefaultLocationWidget />
```

- [ ] **Step 7: Run the full suite**

Run: `npm run test`
Expected: PASS (all suites, including `dashboardPage.spec.ts` and `i18nParity.spec.ts`).

- [ ] **Step 8: Commit** (only if the user has asked for commits this session)

```bash
git add src/components/DefaultLocationWidget.vue src/__tests__/defaultLocationWidget.spec.ts src/pages/DashboardPage.vue src/i18n/messages/en.ts src/i18n/messages/ja.ts
git commit -m "feat: mount the default-location widget iframe on the dashboard"
```

---

### Task 5: "Default" badge on `WeatherCard.vue`

**Files:**
- Modify: `src/components/WeatherCard.vue`
- Modify: `src/__tests__/weatherCard.spec.ts`
- Modify: `src/i18n/messages/en.ts` (add `card.defaultBadge`)
- Modify: `src/i18n/messages/ja.ts` (add `card.defaultBadge`)

**Interfaces:**
- Consumes: `defaultCityKey` from Task 2 (`@/stores/preferences`).
- Produces: nothing new (visual-only change to an existing component).

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/weatherCard.spec.ts`, add the import:

```ts
import { usePreferencesStore } from '@/stores/preferences'
```

Then append two tests inside the existing `describe` block:

```ts
  it('shows the Default badge when the city matches the stored default', async () => {
    const preferences = usePreferencesStore()
    preferences.setDefaultCity(london.key)

    const wrapper = mountCard(london)
    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('Default')
  })

  it('does not show the Default badge for a non-default city', async () => {
    const wrapper = mountCard(london)
    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).not.toContain('Default')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- weatherCard`
Expected: FAIL - the "shows the Default badge" case finds no "Default" text.

- [ ] **Step 3: Implement the badge**

In `src/components/WeatherCard.vue`, add the import:

```ts
import { usePreferencesStore } from '@/stores/preferences'
```

Add the store instance and computed flag (near the existing `store`/`condition` declarations):

```ts
const preferencesStore = usePreferencesStore()
const isDefault = computed(() => props.city.key === preferencesStore.defaultCityKey)
```

In the template, inside `<v-card-title>`, add the chip right after the `<span>{{ displayName }}</span>`:

```html
      <span>{{ displayName }}</span>
      <v-chip v-if="isDefault" size="small" color="primary" class="ml-2">
        {{ t('card.defaultBadge') }}
      </v-chip>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- weatherCard`
Expected: PASS.

- [ ] **Step 5: Add the i18n key to both locales**

In `src/i18n/messages/en.ts`, inside the `card:` block, add:

```ts
    refresh: 'Refresh',
    defaultBadge: 'Default',
```

In `src/i18n/messages/ja.ts`, inside the `card:` block, add:

```ts
    refresh: '更新',
    defaultBadge: 'デフォルト',
```

- [ ] **Step 6: Run the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 7: Commit** (only if the user has asked for commits this session)

```bash
git add src/components/WeatherCard.vue src/__tests__/weatherCard.spec.ts src/i18n/messages/en.ts src/i18n/messages/ja.ts
git commit -m "feat: show a Default badge on the default city's weather card"
```

---

### Task 6: the widget mini-app (`widgets/default-location-widget/`)

This is a genuinely separate npm project - it does not import anything from `src/`. It has no
automated tests (spec's explicit scope decision - its origin-check is 3 lines and the
security-relevant boundary is already covered by Task 4's tests). Its two mechanical checks are
`npm install` succeeding and `vue-tsc --build` reporting zero type errors; final confirmation is
the manual browser check in Task 7.

**Files:**
- Create: `widgets/default-location-widget/package.json`
- Create: `widgets/default-location-widget/vite.config.ts`
- Create: `widgets/default-location-widget/tsconfig.json`
- Create: `widgets/default-location-widget/index.html`
- Create: `widgets/default-location-widget/src/main.ts`
- Create: `widgets/default-location-widget/src/App.vue`
- Create: `widgets/default-location-widget/src/vite-env.d.ts`

**Interfaces:**
- Consumes: nothing from `src/` (separate project by design). Mirrors the message shapes from
  Task 3's `src/types/widgetMessages.ts` locally, as plain inline types - not imported.
- Produces: a dev server on port `5174` that Task 4's `DefaultLocationWidget.vue` iframes in.
- Parent origin default: `http://localhost:5173` (the main app's Vite default port),
  overridable via `VITE_PARENT_ORIGIN`.

- [ ] **Step 1: Scaffold the project files**

Create `widgets/default-location-widget/package.json`:

```json
{
  "name": "default-location-widget",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --build && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.38"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.7",
    "typescript": "~6.0.3",
    "vite": "^7.3.6",
    "vue-tsc": "^3.3.4"
  }
}
```

Create `widgets/default-location-widget/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Fixed port 5174 so the main app's DefaultLocationWidget.vue fallback URL
// (http://localhost:5174) works with zero .env setup.
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
  },
})
```

Create `widgets/default-location-widget/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"]
}
```

Create `widgets/default-location-widget/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Default Location Widget</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `widgets/default-location-widget/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

Create `widgets/default-location-widget/src/main.ts`:

```ts
import { createApp } from 'vue'

import App from './App.vue'

createApp(App).mount('#app')
```

- [ ] **Step 2: Write `App.vue`**

Create `widgets/default-location-widget/src/App.vue`:

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface SavedCityLite {
  key: string
  name: string
  latitude: number
  longitude: number
  admin1?: string
  country?: string
}

interface InitMessage {
  type: 'widget:init'
  cities: SavedCityLite[]
  defaultCityKey: string | null
}

// Falls back to the main app's fixed dev port so this works with zero .env setup;
// VITE_PARENT_ORIGIN overrides it if the main app is ever served elsewhere.
const PARENT_ORIGIN =
  (import.meta.env.VITE_PARENT_ORIGIN as string | undefined) ?? 'http://localhost:5173'

const hasInitialized = ref(false)
const cities = ref<SavedCityLite[]>([])
const selectedKey = ref<string | null>(null)
const defaultCityKey = ref<string | null>(null)
const isRainyTomorrow = ref(false)
const rainyCityName = ref('')
const checkingRain = ref(false)

function isTrustedOrigin(origin: string): boolean {
  return origin === PARENT_ORIGIN
}

async function checkRain(cityKey: string) {
  const city = cities.value.find((c) => c.key === cityKey)
  if (!city) return

  checkingRain.value = true
  isRainyTomorrow.value = false
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(city.latitude))
    url.searchParams.set('longitude', String(city.longitude))
    url.searchParams.set('daily', 'precipitation_probability_max,weathercode')
    url.searchParams.set('forecast_days', '2')
    url.searchParams.set('timezone', 'auto')

    const response = await fetch(url.toString())
    const data = await response.json()
    const tomorrowProbability: number = data?.daily?.precipitation_probability_max?.[1] ?? 0

    isRainyTomorrow.value = tomorrowProbability >= 50
    rainyCityName.value = city.name
  } finally {
    checkingRain.value = false
  }
}

function onSelectChange() {
  if (selectedKey.value) checkRain(selectedKey.value)
}

function setAsDefault() {
  if (!selectedKey.value) return
  window.parent.postMessage(
    { type: 'widget:set-default', cityKey: selectedKey.value },
    PARENT_ORIGIN,
  )
  defaultCityKey.value = selectedKey.value
}

function handleMessage(event: MessageEvent) {
  if (!isTrustedOrigin(event.origin)) return

  const data = event.data as { type?: unknown } | null
  if (!data || data.type !== 'widget:init') return

  const init = event.data as InitMessage
  hasInitialized.value = true
  cities.value = init.cities
  defaultCityKey.value = init.defaultCityKey
  selectedKey.value = init.defaultCityKey ?? init.cities[0]?.key ?? null
  if (selectedKey.value) checkRain(selectedKey.value)
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
  window.parent.postMessage({ type: 'widget:ready' }, PARENT_ORIGIN)
})
</script>

<template>
  <main class="widget">
    <h1>Default location</h1>

    <p v-if="!hasInitialized" class="status">Waiting for the dashboard...</p>
    <p v-else-if="cities.length === 0" class="status">
      No saved cities yet - add one on the dashboard.
    </p>

    <template v-else>
      <select v-model="selectedKey" @change="onSelectChange">
        <option v-for="city in cities" :key="city.key" :value="city.key">
          {{ city.name }}
        </option>
      </select>

      <p v-if="checkingRain" class="status">Checking tomorrow's forecast...</p>
      <p v-else-if="isRainyTomorrow" class="banner">
        Rain expected tomorrow in {{ rainyCityName }}
      </p>

      <div>
        <button :disabled="selectedKey === defaultCityKey" @click="setAsDefault">
          Set as default
        </button>
        <p v-if="selectedKey === defaultCityKey" class="status">This is the default location.</p>
      </div>
    </template>
  </main>
</template>

<style>
.widget {
  font-family: system-ui, sans-serif;
  padding: 12px;
  border: 2px dashed #999;
  border-radius: 4px;
  box-sizing: border-box;
}
.banner {
  background: #fde68a;
  padding: 8px;
  border-radius: 4px;
}
.status {
  color: #555;
  font-size: 0.9em;
}
</style>
```

- [ ] **Step 3: Install dependencies**

Run: `cd widgets/default-location-widget && npm install`
Expected: installs cleanly, no errors.

- [ ] **Step 4: Type-check**

Run: `cd widgets/default-location-widget && npx vue-tsc --build`
Expected: exits 0, no type errors.

- [ ] **Step 5: Commit** (only if the user has asked for commits this session)

```bash
git add widgets/default-location-widget
git commit -m "feat: add the default-location-widget mini-app"
```

Note: if `widgets/default-location-widget/node_modules` is not already covered by the repo's
root `.gitignore` (check `.gitignore` for a `node_modules` or `**/node_modules` pattern before
this step - it almost certainly already is, since the root `node_modules` is excluded the same
way), add a `.gitignore` in `widgets/default-location-widget/` first so its `node_modules` isn't
staged.

---

### Task 7: End-to-end manual verification

This is the check that the two separate projects actually work together as a micro-frontend -
not unit-testable (real cross-origin `postMessage` between two dev servers), so it's a manual
checklist, run after Tasks 1-6 are all done.

**Files:** none - verification only.

- [ ] **Step 1: Start both dev servers**

Terminal A:
```bash
cd widgets/default-location-widget
npm run dev
```
Confirm it serves on `http://localhost:5174`.

Terminal B (repo root):
```bash
npm run dev
```
Confirm it serves on `http://localhost:5173`.

- [ ] **Step 2: Seed at least two saved cities**

Open `http://localhost:5173`, use the city search to add two cities (e.g. "London" and
"Tokyo").

- [ ] **Step 3: Confirm the widget iframe loads and initializes**

On the dashboard, confirm the "Default location" card renders with an iframe inside it, and
that the iframe's `<select>` lists both saved cities (not "Waiting for the dashboard...").

- [ ] **Step 4: Confirm the rain check runs**

Switch the widget's dropdown between the two cities. Confirm no console errors appear and that
either the rain banner or nothing shows, consistent with each city's real forecast (the exact
outcome depends on live weather - the point is it doesn't crash either way).

- [ ] **Step 5: Confirm "Set as default" reaches the parent**

Click "Set as default" in the widget for one city. Confirm:
- The button becomes disabled and "This is the default location." appears in the widget.
- On the main dashboard, that city's `WeatherCard` now shows the "Default" badge - without a
  page reload (Pinia reactivity).

- [ ] **Step 6: Confirm persistence**

Reload `http://localhost:5173` (F5). Confirm the same city still shows the "Default" badge, and
that the widget iframe re-initializes with that city pre-selected and its "Set as default"
button already disabled.

- [ ] **Step 7: Confirm the map embed**

Navigate to either city's detail page. Confirm the "Location map" card renders an OpenStreetMap
iframe with a marker near the city.

- [ ] **Step 8: Report back**

Tell the user the checklist results (pass/fail per step) - if anything fails, treat it as a bug
to fix before considering this plan done, not something to silently work around.

---

## Task Order & Dependencies

```
Task 1 (OSM map)         - independent, no dependencies
Task 2 (preferences)     - independent, no dependencies
Task 3 (origin helper)   - independent, no dependencies
Task 4 (widget-side UI)  - depends on Task 2, Task 3
Task 5 (badge)           - depends on Task 2
Task 6 (mini-app)        - depends on Task 3 (message shapes, mirrored not imported)
Task 7 (manual E2E)      - depends on Tasks 1, 4, 5, 6
```

Tasks 1, 2, 3 can run in any order (or in parallel across subagents). Task 4 needs 2 and 3 done
first. Task 5 needs 2 done first. Task 6 can start any time (only needs the message *shapes*
from Task 3's spec, not its code). Task 7 is last.
