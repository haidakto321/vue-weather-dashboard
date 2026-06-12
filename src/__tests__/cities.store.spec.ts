import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useCitiesStore } from '@/stores/cities'
import type { GeoCity } from '@/types/weather'

// Two distinct geocoding fixtures (different ids) for add/dedupe/remove coverage.
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

describe('cities store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a city', () => {
    const store = useCitiesStore()
    store.addCity(london)
    expect(store.cities).toHaveLength(1)
    expect(store.cities[0].name).toBe('London')
  })

  it('dedupes: adding the same city twice is a no-op', () => {
    const store = useCitiesStore()
    store.addCity(london)
    store.addCity(london)
    expect(store.cities).toHaveLength(1)
  })

  it('removes a city by key', () => {
    const store = useCitiesStore()
    store.addCity(london)
    store.addCity(tokyo)
    const key = store.cities[0].key
    store.removeCity(key)
    expect(store.cities).toHaveLength(1)
    expect(store.cities[0].name).toBe('Tokyo')
  })

  it('removeCity with an unknown key is a no-op', () => {
    const store = useCitiesStore()
    store.addCity(london)
    store.removeCity('does-not-exist')
    expect(store.cities).toHaveLength(1)
  })
})
