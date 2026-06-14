import { computed } from 'vue'

import { usePreferencesStore } from '@/stores/preferences'

// All stored temps are °C; this composable converts to the user's chosen unit for display
// only. It is the ONE place temperature-unit logic lives, so card, list, and chart all show
// the same unit and update live when the preference changes (success #1).

// Pure conversion - exported so it can be unit-tested without any store.
export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32
}

export function useTemperature() {
  const prefs = usePreferencesStore()

  // Reactive unit from the preferences store; everything below derives from it, so any
  // component using these helpers re-renders when the unit changes.
  const unit = computed(() => prefs.unit)
  const unitSymbol = computed(() => (unit.value === 'fahrenheit' ? '°F' : '°C'))

  // Value in the active unit (identity for celsius).
  function convert(celsius: number): number {
    return unit.value === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius
  }

  // Rounded display string with the active unit symbol, e.g. "21°C" / "32°F". Reads the
  // reactive unit at call time so callers stay live.
  function format(celsius: number): string {
    return `${Math.round(convert(celsius))}${unitSymbol.value}`
  }

  return { unit, unitSymbol, convert, format }
}
