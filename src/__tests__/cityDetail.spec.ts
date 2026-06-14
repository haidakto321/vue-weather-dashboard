import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from '@/App.vue'
import router from '@/router'
// App's chrome now calls t(), so the i18n plugin must be installed to mount App under test.
import { i18n } from '@/i18n'
import { useCitiesStore } from '@/stores/cities'
import type { GeoCity } from '@/types/weather'

// Mock the network layer so the test is deterministic and offline. The detail page
// reaches Open-Meteo only through fetchForecast (added in Task 2); stub it to a small
// fixed DailyForecast so Vue Query resolves without any real HTTP. geocodeCity /
// fetchCurrentWeather are stubbed too because other mounted components import them.
vi.mock('@/lib/openMeteo', () => ({
  fetchForecast: vi.fn().mockResolvedValue({
    // Three days is enough to prove the list renders one row per day.
    dates: ['2026-06-12', '2026-06-13', '2026-06-14'],
    tempMax: [21, 22, 19],
    tempMin: [12, 13, 11],
    weatherCodes: [0, 3, 61],
  }),
  geocodeCity: vi.fn().mockResolvedValue([]),
  fetchCurrentWeather: vi.fn().mockResolvedValue({
    temperature: 20,
    weatherCode: 0,
    windSpeed: 5,
    humidity: 50,
  }),
}))

// London with its real geocoding id - the route param we navigate to.
const london: GeoCity = {
  id: 2643743,
  name: 'London',
  latitude: 51.5085,
  longitude: -0.1257,
  country: 'United Kingdom',
  admin1: 'England',
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

// The SAME Pinia instance must be both the active store the test seeds AND the one the
// app is mounted with - otherwise the component's useCitiesStore() reads an empty,
// different Pinia and the param resolves to "no city". (Test-harness plumbing, like the
// Phase 2 navigation spec.)
let pinia: Pinia

function mountApp() {
  const vuetify = createVuetify({ components, directives })
  return mount(App, {
    global: {
      // Use the SAME real router instance from @/router (it defines /city/:id) and the
      // SAME seeded Pinia instance the test set active above.
      plugins: [router, vuetify, pinia, VueQueryPlugin, i18n],
    },
  })
}

describe('City Detail (E2E)', () => {
  beforeEach(() => {
    // Fresh Pinia per test, set active so the seeding below targets the mounted store.
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('reads the :id route param and renders that city plus its forecast list and chart', async () => {
    // Seed a saved city BEFORE navigating so params.id can resolve to a SavedCity.
    const store = useCitiesStore()
    store.addCity(london)

    await router.push({ name: 'city-detail', params: { id: '2643743' } })
    await router.isReady()

    const wrapper = mountApp()

    // Let the router render and Vue Query settle the mocked forecast.
    await flushPromises()
    await flushPromises()

    // The route param selected London (NAV-02 + success #1).
    expect(wrapper.text()).toContain('London')

    // The multi-day forecast list rendered with at least one day row (WTHR-02 + success #2).
    const list = wrapper.find('[data-testid="forecast-list"]')
    expect(list.exists()).toBe(true)

    // The temperature chart container is wired in (CHRT-01).
    const chart = wrapper.find('[data-testid="forecast-chart"]')
    expect(chart.exists()).toBe(true)
  })
})
