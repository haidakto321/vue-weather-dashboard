import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { usePreferencesStore } from '@/stores/preferences'
import { DEFAULT_PREFERENCES } from '@/types/preferences'

describe('preferences store', () => {
  beforeEach(() => {
    // The store persists via VueUse useLocalStorage, so clear storage before each test
    // (before setActivePinia) so every test starts from defaults.
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts from DEFAULT_PREFERENCES', () => {
    const store = usePreferencesStore()
    expect(store.unit).toBe(DEFAULT_PREFERENCES.unit)
    expect(store.theme).toBe(DEFAULT_PREFERENCES.theme)
    expect(store.language).toBe(DEFAULT_PREFERENCES.language)
    expect(store.windUnit).toBe(DEFAULT_PREFERENCES.windUnit)
  })

  it('setUnit updates the unit', () => {
    const store = usePreferencesStore()
    store.setUnit('fahrenheit')
    expect(store.unit).toBe('fahrenheit')
  })

  it('setWindUnit updates the wind unit', () => {
    const store = usePreferencesStore()
    store.setWindUnit('mph')
    expect(store.windUnit).toBe('mph')
  })

  it('setTheme updates the theme', () => {
    const store = usePreferencesStore()
    store.setTheme('dark')
    expect(store.theme).toBe('dark')
  })

  it('setLanguage updates the language', () => {
    const store = usePreferencesStore()
    store.setLanguage('ja')
    expect(store.language).toBe('ja')
  })

  it('persists a setter change to the weather-prefs localStorage key', () => {
    const store = usePreferencesStore()
    store.setUnit('fahrenheit')
    const raw = localStorage.getItem('weather-prefs')
    expect(raw).not.toBeNull()
    const stored = JSON.parse(raw as string)
    expect(stored.unit).toBe('fahrenheit')
  })

  it('falls back to the default unit when localStorage holds an invalid unit', () => {
    // Seed a tampered value before the store reads it (threat T-04-01).
    localStorage.setItem(
      'weather-prefs',
      JSON.stringify({ unit: 'kelvin', theme: 'light', language: 'en' }),
    )
    const store = usePreferencesStore()
    expect(store.unit).toBe(DEFAULT_PREFERENCES.unit)
  })

  it('falls back to the default wind unit when localStorage holds an invalid windUnit', () => {
    // Seed a tampered value before the store reads it (threat T-07-PREF).
    localStorage.setItem(
      'weather-prefs',
      JSON.stringify({ unit: 'celsius', theme: 'light', language: 'en', windUnit: 'knots' }),
    )
    const store = usePreferencesStore()
    expect(store.windUnit).toBe(DEFAULT_PREFERENCES.windUnit)
  })
})
