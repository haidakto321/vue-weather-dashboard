import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

import {
  DEFAULT_PREFERENCES,
  TEMPERATURE_UNITS,
  WIND_UNITS,
  THEME_MODES,
  LANGUAGES,
} from '@/types/preferences'
import type {
  Preferences,
  TemperatureUnit,
  WindUnit,
  ThemeMode,
  Language,
} from '@/types/preferences'

// Pinia = the single source of preference state (unit/theme/language).
// VueUse useLocalStorage = persistence: it reads/writes the 'weather-prefs' key and keeps
// the ref in sync with localStorage, so any change auto-persists and survives a reload
// (PERS-01, CMPS-01). A setup-style store is used (not the options style) so the store can
// own the useLocalStorage ref directly.

// localStorage is user/tamper-controllable. Sanitize every field on read-back against the
// allowed-value lists; an unknown/corrupt value falls back to the default so a tampered
// entry can never feed an invalid unit/theme/locale into the UI or crash hydration
// (threat T-04-01).
function sanitize(p: Partial<Preferences> | null | undefined): Preferences {
  const source = p ?? {}
  return {
    unit: (TEMPERATURE_UNITS as readonly string[]).includes(source.unit as string)
      ? (source.unit as TemperatureUnit)
      : DEFAULT_PREFERENCES.unit,
    windUnit: (WIND_UNITS as readonly string[]).includes(source.windUnit as string)
      ? (source.windUnit as WindUnit)
      : DEFAULT_PREFERENCES.windUnit,
    theme: (THEME_MODES as readonly string[]).includes(source.theme as string)
      ? (source.theme as ThemeMode)
      : DEFAULT_PREFERENCES.theme,
    language: (LANGUAGES as readonly string[]).includes(source.language as string)
      ? (source.language as Language)
      : DEFAULT_PREFERENCES.language,
  }
}

export const usePreferencesStore = defineStore('preferences', () => {
  // The persisted state. mergeDefaults: true merges a partial/older stored object with the
  // defaults, so when 04-02/04-03 start writing theme/language an older 'weather-prefs'
  // entry stays forward-compatible.
  const prefs = useLocalStorage<Preferences>('weather-prefs', DEFAULT_PREFERENCES, {
    mergeDefaults: true,
    // Write through to localStorage synchronously so a preference change persists
    // immediately (it survives even a very fast reload, and tests can read it back at once).
    flush: 'sync',
  })

  // Validate once at store creation: rewrite the persisted value to its sanitized form so a
  // corrupt entry is repaired in place rather than carried around.
  prefs.value = sanitize(prefs.value)

  // Reactive getters - components read these.
  const unit = computed(() => prefs.value.unit)
  const windUnit = computed(() => prefs.value.windUnit)
  const theme = computed(() => prefs.value.theme)
  const language = computed(() => prefs.value.language)

  // Explicit setters - writing into the persisted ref auto-persists via VueUse.
  function setUnit(u: TemperatureUnit) {
    prefs.value.unit = u
  }
  function setWindUnit(w: WindUnit) {
    prefs.value.windUnit = w
  }
  function setTheme(t: ThemeMode) {
    prefs.value.theme = t
  }
  function setLanguage(l: Language) {
    prefs.value.language = l
  }

  return { unit, windUnit, theme, language, setUnit, setWindUnit, setTheme, setLanguage }
})
