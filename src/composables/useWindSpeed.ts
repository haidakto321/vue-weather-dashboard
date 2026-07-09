import { computed } from 'vue'

import { usePreferencesStore } from '@/stores/preferences'

// All stored wind speeds are km/h; this composable converts to the user's chosen unit for
// display only. Direct structural mirror of useTemperature.ts - same shape, same reasoning
// (ONE place wind-unit logic lives, so every consumer updates live when the preference
// changes).

// Pure conversion - exported so it can be unit-tested without any store.
export function kmhToMph(kmh: number): number {
  return kmh * 0.621371
}

export function useWindSpeed() {
  const prefs = usePreferencesStore()

  // Reactive unit from the preferences store; everything below derives from it, so any
  // component using these helpers re-renders when the wind unit changes.
  const unit = computed(() => prefs.windUnit)
  const unitSymbol = computed(() => (unit.value === 'mph' ? 'mph' : 'km/h'))

  // Value in the active unit (identity for kmh).
  function convert(kmh: number): number {
    return unit.value === 'mph' ? kmhToMph(kmh) : kmh
  }

  // Rounded display string with the active unit symbol, e.g. "20 km/h" / "12 mph". A space
  // separates the number from the symbol here (unlike useTemperature's "21°C") because
  // "20km/h" doesn't read naturally the way "21°C" does. Reads the reactive unit at call
  // time so callers stay live.
  function format(kmh: number): string {
    return `${Math.round(convert(kmh))} ${unitSymbol.value}`
  }

  return { unit, unitSymbol, convert, format }
}
