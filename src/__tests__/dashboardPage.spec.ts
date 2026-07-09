import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { nextTick } from 'vue'

import { i18n } from '@/i18n'
import DashboardPage from '@/pages/DashboardPage.vue'
import { useCitiesStore } from '@/stores/cities'
import type { GeoCity } from '@/types/weather'

// Same network-mocking pattern as cityDetail.spec.ts: DashboardPage renders WeatherCard
// per saved city, and WeatherCard calls useCurrentWeather (fetchCurrentWeather) - stub it to
// a fixed fixture covering all nine Plan 07-02 fields so the card settles deterministically.
vi.mock('@/lib/openMeteo', () => ({
  fetchCurrentWeather: vi.fn().mockResolvedValue({
    temperature: 20,
    weatherCode: 0,
    windSpeed: 5,
    humidity: 50,
    feelsLike: 19,
    precipitation: 0,
    uvIndex: 3,
    sunrise: '2026-06-12T04:35',
    sunset: '2026-06-12T19:20',
  }),
  geocodeCity: vi.fn().mockResolvedValue([]),
}))

const london: GeoCity = {
  id: 2643743,
  name: 'London',
  latitude: 51.5085,
  longitude: -0.1257,
  country: 'United Kingdom',
  admin1: 'England',
}

const tokyo: GeoCity = {
  id: 1850147,
  name: 'Tokyo',
  latitude: 35.6895,
  longitude: 139.6917,
  country: 'Japan',
}

// jsdom does not implement ResizeObserver and ships only a partial matchMedia, both of
// which Vuetify touches. Install no-op shims so Vuetify components mount cleanly.
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

function buildRouter(): Router {
  // WeatherCard's :to prop needs a resolvable 'city-detail' route even though this test
  // never navigates there.
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: DashboardPage },
      { path: '/city/:id', name: 'city-detail', component: { template: '<div/>' } },
    ],
  })
}

function mountDashboard(router: Router, pinia: Pinia) {
  const vuetify = createVuetify({ components, directives })
  return mount(DashboardPage, {
    global: {
      plugins: [router, vuetify, pinia, VueQueryPlugin, i18n],
    },
  })
}

describe('DashboardPage', () => {
  let pinia: Pinia

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders one weather-card per saved city, in the seeded order', async () => {
    const store = useCitiesStore()
    store.addCity(london)
    await nextTick()
    store.addCity(tokyo)
    await nextTick()

    const router = buildRouter()
    router.push('/')
    await router.isReady()

    const wrapper = mountDashboard(router, pinia)
    await flushPromises()

    const cards = wrapper.findAll('[data-testid="weather-card"]')
    expect(cards).toHaveLength(2)
    expect(cards[0]?.text()).toContain('London')
    expect(cards[1]?.text()).toContain('Tokyo')
  })

  it('re-renders in the new order once the store reorders the cities reactively', async () => {
    const store = useCitiesStore()
    store.addCity(london)
    await nextTick()
    store.addCity(tokyo)
    await nextTick()

    const router = buildRouter()
    router.push('/')
    await router.isReady()

    const wrapper = mountDashboard(router, pinia)
    await flushPromises()

    // Drive the same store action the draggable's @update:model-value handler calls -
    // proves the template's #item slot is bound reactively to the store's cities array.
    store.reorderCities([...store.cities].reverse())
    await nextTick()
    await flushPromises()

    const cards = wrapper.findAll('[data-testid="weather-card"]')
    expect(cards).toHaveLength(2)
    expect(cards[0]?.text()).toContain('Tokyo')
    expect(cards[1]?.text()).toContain('London')
  })
})
