// Shared preference contracts for Phase 4. Defined once here and consumed across the
// preferences store, the useTemperature composable, the Settings UI, and (in 04-02/04-03)
// the theme + i18n wiring. Because verbatimModuleSyntax is on, downstream files import
// these with `import type`.

// The three preference axes are modelled as string-literal unions (not enums) for
// readability and so the localStorage validators and the Settings dropdowns can share the
// same option arrays as a single source of truth.

// Temperature display unit. Stored temps stay °C; the unit only affects display.
export type TemperatureUnit = 'celsius' | 'fahrenheit'

// Wind speed display unit. Stored wind speeds stay km/h; the unit only affects display
// (mirrors TemperatureUnit exactly - see useWindSpeed.ts).
export type WindUnit = 'kmh' | 'mph'

// Vuetify theme mode (wired live in 04-02).
export type ThemeMode = 'light' | 'dark'

// UI language (wired live in 04-03).
export type Language = 'en' | 'ja'

// The full preference object held by the preferences store.
export interface Preferences {
  unit: TemperatureUnit
  windUnit: WindUnit
  theme: ThemeMode
  language: Language
}

// App defaults: metric, light theme, English - matches how the app behaves today.
export const DEFAULT_PREFERENCES: Preferences = {
  unit: 'celsius',
  windUnit: 'kmh',
  theme: 'light',
  language: 'en',
}

// Valid values per axis. Reused by both the Settings controls (dropdown items) and the
// read-back validators in the store, so there is exactly one list of allowed values.
export const TEMPERATURE_UNITS = ['celsius', 'fahrenheit'] as const
export const WIND_UNITS = ['kmh', 'mph'] as const
export const THEME_MODES = ['light', 'dark'] as const
export const LANGUAGES = ['en', 'ja'] as const
