import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

import type { GeoCity, SavedCity } from '@/types/weather'

// Pinia = client state: the list of cities the user has saved.
// VueUse useLocalStorage persists that list to the 'weather-cities' key, so saved cities
// survive a page reload (PERS-01). A setup-style store is used so it can own the
// useLocalStorage ref directly.

// Derive a stable dedupe key: prefer the geocoding id, else fall back to a
// lat,lon,name composite (covers the rare result without an id).
function cityKey(c: Pick<GeoCity, 'id' | 'latitude' | 'longitude' | 'name'>): string {
  return c.id ? String(c.id) : `${c.latitude},${c.longitude},${c.name}`
}

// localStorage is user/tamper-controllable. On read-back keep only well-formed entries: an
// object with a string `key` and numeric id/latitude/longitude. A tampered 'weather-cities'
// array therefore cannot inject malformed objects into the cards/queries (threat T-04-02).
function isValidSavedCity(c: unknown): c is SavedCity {
  if (typeof c !== 'object' || c === null) return false
  const o = c as Record<string, unknown>
  return (
    typeof o.key === 'string' &&
    typeof o.id === 'number' &&
    typeof o.latitude === 'number' &&
    typeof o.longitude === 'number' &&
    typeof o.name === 'string'
  )
}

export const useCitiesStore = defineStore('cities', () => {
  // Persisted list. The raw stored value is validated below so corrupt entries are dropped.
  // flush: 'sync' so an add/remove persists immediately (survives a fast reload).
  const cities = useLocalStorage<SavedCity[]>('weather-cities', [], { flush: 'sync' })

  // Repair the read-back value once at store creation: drop malformed entries.
  if (!Array.isArray(cities.value)) {
    cities.value = []
  } else {
    cities.value = cities.value.filter(isValidSavedCity)
  }

  const hasCities = computed<boolean>(() => cities.value.length > 0)

  // Add a geocoded city. Dedupe by stable key: a city already saved is a no-op.
  function addCity(geo: GeoCity) {
    const key = cityKey(geo)
    if (cities.value.some((c) => c.key === key)) return
    cities.value.push({
      key,
      id: geo.id,
      name: geo.name,
      latitude: geo.latitude,
      longitude: geo.longitude,
      country: geo.country,
      admin1: geo.admin1,
    })
  }

  // Remove the city with this key; unknown key is a no-op.
  function removeCity(key: string) {
    cities.value = cities.value.filter((c) => c.key !== key)
  }

  // Replace the whole order - useLocalStorage's watcher persists it the same way
  // addCity's push and removeCity's filter already do.
  function reorderCities(newOrder: SavedCity[]) {
    cities.value = newOrder
  }

  return { cities, hasCities, addCity, removeCity, reorderCities }
})
