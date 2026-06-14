import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { celsiusToFahrenheit, useTemperature } from '@/composables/useTemperature'
import { usePreferencesStore } from '@/stores/preferences'

describe('useTemperature', () => {
  beforeEach(() => {
    // The composable reads the preferences store, which persists via useLocalStorage.
    // Clear storage then seed a fresh Pinia so each test starts from defaults (celsius).
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('celsiusToFahrenheit converts exactly', () => {
    expect(celsiusToFahrenheit(0)).toBe(32)
    expect(celsiusToFahrenheit(100)).toBe(212)
    expect(celsiusToFahrenheit(-40)).toBe(-40)
  })

  it('formats in celsius by default', () => {
    const { format } = useTemperature()
    expect(format(21.4)).toBe('21°C')
  })

  it('formats in fahrenheit after setUnit', () => {
    const prefs = usePreferencesStore()
    prefs.setUnit('fahrenheit')
    const { format } = useTemperature()
    expect(format(0)).toBe('32°F')
  })

  it('is reactive to a unit change on the store', () => {
    const prefs = usePreferencesStore()
    const { format } = useTemperature()
    expect(format(0)).toBe('0°C')
    prefs.setUnit('fahrenheit')
    expect(format(0)).toBe('32°F')
  })
})
