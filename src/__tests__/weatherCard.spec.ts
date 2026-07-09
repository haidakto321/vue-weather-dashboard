import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import WeatherCard from '@/components/WeatherCard.vue'
import { i18n } from '@/i18n'
import { fetchCurrentWeather } from '@/lib/openMeteo'
import type { SavedCity } from '@/types/weather'

// Component test stubs the HTTP layer with a module mock (same convention as
// citySearch.spec.ts/cityDetail.spec.ts) so this stays fast, deterministic and offline.
// The fixture is the Plan-07-02-extended CurrentWeather shape (feelsLike/precipitation/
// uvIndex/sunrise/sunset), matching Pitfall 5's "keep mocks in sync with the real shape"
// warning.
vi.mock('@/lib/openMeteo', () => ({
  fetchCurrentWeather: vi.fn().mockResolvedValue({
    temperature: 20,
    weatherCode: 0,
    windSpeed: 18,
    humidity: 50,
    feelsLike: 19,
    precipitation: 0.4,
    uvIndex: 3,
    sunrise: '2026-07-08T04:52',
    sunset: '2026-07-08T19:47',
  }),
}))

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

// A realistic saved city fixture.
const london: SavedCity = {
  key: '2643743',
  id: 2643743,
  name: 'London',
  latitude: 51.5085,
  longitude: -0.1257,
  country: 'United Kingdom',
  admin1: 'England',
}

let pinia: Pinia

function buildRouter(): Router {
  // Only the target route needs to exist - WeatherCard's :to just needs a matching name.
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/city/:id', name: 'city-detail', component: { template: '<div/>' } }],
  })
}

function mountCard(city: SavedCity) {
  const vuetify = createVuetify({ components, directives })
  const router = buildRouter()
  return mount(WeatherCard, {
    props: { city },
    global: {
      plugins: [router, vuetify, pinia, VueQueryPlugin, i18n],
    },
  })
}

describe('WeatherCard (richer conditions, wind unit, route-by-key, refresh)', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.mocked(fetchCurrentWeather).mockClear()
    vi.mocked(fetchCurrentWeather).mockResolvedValue({
      temperature: 20,
      weatherCode: 0,
      windSpeed: 18,
      humidity: 50,
      feelsLike: 19,
      precipitation: 0.4,
      uvIndex: 3,
      sunrise: '2026-07-08T04:52',
      sunset: '2026-07-08T19:47',
    })
  })

  it('renders the richer current-conditions fields once the query resolves', async () => {
    const wrapper = mountCard(london)
    await flushPromises()
    await flushPromises()

    const text = wrapper.text()
    // card.feelsLike / card.precipitation / card.uvIndex render the fixture's values.
    expect(text).toContain('19')
    expect(text).toContain('0.4')
    expect(text).toContain('3')
  })

  it('routes two geolocation-added cities (both id: 0) to distinct hrefs via city.key', async () => {
    const geoHome: SavedCity = {
      key: '51.5,-0.1,My Location',
      id: 0,
      name: 'My Location',
      latitude: 51.5,
      longitude: -0.1,
      country: '',
    }
    const geoWork: SavedCity = {
      key: '52.5,-1.1,My Location',
      id: 0,
      name: 'My Location',
      latitude: 52.5,
      longitude: -1.1,
      country: '',
    }

    const wrapperHome = mountCard(geoHome)
    const wrapperWork = mountCard(geoWork)
    await flushPromises()
    await flushPromises()

    const hrefHome = wrapperHome.find('a').attributes('href')
    const hrefWork = wrapperWork.find('a').attributes('href')

    expect(hrefHome).toBeTruthy()
    expect(hrefWork).toBeTruthy()
    expect(hrefHome).not.toBe(hrefWork)
    // href only percent-encodes the space in the key (commas are left as-is by vue-router).
    expect(hrefHome).toContain(geoHome.key.replace(/ /g, '%20'))
    expect(hrefWork).toContain(geoWork.key.replace(/ /g, '%20'))
  })

  it('refetches current weather when the refresh button is clicked', async () => {
    const wrapper = mountCard(london)
    await flushPromises()
    await flushPromises()

    expect(fetchCurrentWeather).toHaveBeenCalledTimes(1)

    const card = wrapper.find('[data-testid="weather-card"]')
    const refreshButton = card
      .findAll('button')
      .find((b) => b.attributes('aria-label') === 'Refresh')
    expect(refreshButton).toBeTruthy()

    await refreshButton!.trigger('click')
    await flushPromises()

    expect(fetchCurrentWeather).toHaveBeenCalledTimes(2)
  })
})
