import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { kmhToMph, useWindSpeed } from '@/composables/useWindSpeed'
import { usePreferencesStore } from '@/stores/preferences'

describe('useWindSpeed', () => {
  beforeEach(() => {
    // The composable reads the preferences store, which persists via useLocalStorage.
    // Clear storage then seed a fresh Pinia so each test starts from defaults (kmh).
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('kmhToMph converts exactly', () => {
    expect(kmhToMph(0)).toBe(0)
    expect(kmhToMph(100)).toBeCloseTo(62.1371)
  })

  it('formats in km/h by default', () => {
    const { format } = useWindSpeed()
    expect(format(20)).toBe('20 km/h')
  })

  it('formats in mph after setWindUnit', () => {
    const prefs = usePreferencesStore()
    prefs.setWindUnit('mph')
    const { format } = useWindSpeed()
    expect(format(20)).toBe('12 mph')
  })

  it('is reactive to a windUnit change on the store', () => {
    const prefs = usePreferencesStore()
    const { format } = useWindSpeed()
    expect(format(20)).toBe('20 km/h')
    prefs.setWindUnit('mph')
    expect(format(20)).toBe('12 mph')
  })
})
