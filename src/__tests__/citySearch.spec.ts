import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia, type Pinia } from 'pinia'

import CitySearch from '@/components/CitySearch.vue'
import { i18n } from '@/i18n'
import { useCitiesStore } from '@/stores/cities'
import { geocodeCity } from '@/lib/openMeteo'
import type { GeoCity } from '@/types/weather'

// Component tests stub the HTTP layer with a module mock (not MSW): MSW is only for the
// API-layer spec (openMeteo.spec.ts), where exercising the real axios boundary is the
// point. Here we want a fast, deterministic component test, so geocodeCity is a spy we can
// inspect for call count and the AbortSignal it receives. All exports are mocked because
// the component graph imports them. Default resolves [] so the happy path returns no items.
vi.mock('@/lib/openMeteo', () => ({
  geocodeCity: vi.fn().mockResolvedValue([]),
  fetchCurrentWeather: vi.fn(),
  fetchForecast: vi.fn(),
}))

// A realistic Open-Meteo geocoding result used for the select test.
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

let pinia: Pinia

function mountSearch() {
  // CitySearch uses neither the router nor Vue Query - only Vuetify, Pinia, and i18n.
  const vuetify = createVuetify({ components, directives })
  return mount(CitySearch, {
    global: {
      plugins: [vuetify, pinia, i18n],
    },
  })
}

describe('CitySearch (debounce, abort, select)', () => {
  beforeEach(() => {
    // Fresh Pinia per test so the saved-cities list starts empty.
    pinia = createPinia()
    setActivePinia(pinia)
    // Fake timers so the 300ms debounce is driven deterministically - no real sleeps.
    vi.useFakeTimers()
    vi.mocked(geocodeCity).mockClear()
    vi.mocked(geocodeCity).mockResolvedValue([])
  })

  afterEach(() => {
    // Restore real timers so fake time never leaks into another spec.
    vi.useRealTimers()
  })

  it('debounces to a single geocode call using the latest term', async () => {
    const wrapper = mountSearch()
    const autocomplete = wrapper.findComponent({ name: 'VAutocomplete' })

    // Two quick keystrokes: only the last should reach geocodeCity, and not until the
    // debounce window elapses.
    autocomplete.vm.$emit('update:search', 'Lon')
    autocomplete.vm.$emit('update:search', 'Lond')
    expect(geocodeCity).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(geocodeCity).toHaveBeenCalledTimes(1)
    expect(vi.mocked(geocodeCity).mock.calls[0][0]).toBe('Lond')
  })

  it('aborts the previous in-flight request when a newer term arrives', async () => {
    // First request never resolves, so its AbortController stays live long enough for the
    // second search to abort it.
    vi.mocked(geocodeCity).mockReturnValueOnce(new Promise<GeoCity[]>(() => {}))

    const wrapper = mountSearch()
    const autocomplete = wrapper.findComponent({ name: 'VAutocomplete' })

    autocomplete.vm.$emit('update:search', 'London')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(geocodeCity).toHaveBeenCalledTimes(1)
    // The AbortSignal handed to the first (still-pending) request.
    const firstSignal = vi.mocked(geocodeCity).mock.calls[0][1] as AbortSignal
    expect(firstSignal.aborted).toBe(false)

    // A newer term must abort that first request.
    autocomplete.vm.$emit('update:search', 'Paris')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(geocodeCity).toHaveBeenCalledTimes(2)
    expect(firstSignal.aborted).toBe(true)
  })

  it('saves the selected city to the store and clears the field', async () => {
    const wrapper = mountSearch()
    const autocomplete = wrapper.findComponent({ name: 'VAutocomplete' })
    const store = useCitiesStore()

    // Selecting an item emits update:model-value with the chosen GeoCity.
    autocomplete.vm.$emit('update:model-value', london)
    await flushPromises()

    // The store received the city (addCity, deduped by key).
    expect(store.cities).toHaveLength(1)
    expect(store.cities[0]).toMatchObject({ id: 2643743, name: 'London' })

    // The field is cleared: the v-model (selected) is reset to null so the box is ready
    // for the next search.
    expect(autocomplete.props('modelValue')).toBeNull()
  })
})
