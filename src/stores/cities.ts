import { defineStore } from 'pinia'

import type { GeoCity, SavedCity } from '@/types/weather'

// Pinia = client state: the list of cities the user has saved. In-memory only this
// phase - no localStorage (persistence is Phase 4).

// Derive a stable dedupe key: prefer the geocoding id, else fall back to a
// lat,lon,name composite (covers the rare result without an id).
function cityKey(c: Pick<GeoCity, 'id' | 'latitude' | 'longitude' | 'name'>): string {
  return c.id ? String(c.id) : `${c.latitude},${c.longitude},${c.name}`
}

export const useCitiesStore = defineStore('cities', {
  state: () => ({
    cities: [] as SavedCity[],
  }),
  getters: {
    hasCities: (state): boolean => state.cities.length > 0,
  },
  actions: {
    // Add a geocoded city. Dedupe by stable key: a city already saved is a no-op.
    addCity(geo: GeoCity) {
      const key = cityKey(geo)
      if (this.cities.some((c) => c.key === key)) return
      this.cities.push({
        key,
        id: geo.id,
        name: geo.name,
        latitude: geo.latitude,
        longitude: geo.longitude,
        country: geo.country,
        admin1: geo.admin1,
      })
    },
    // Remove the city with this key; unknown key is a no-op.
    removeCity(key: string) {
      this.cities = this.cities.filter((c) => c.key !== key)
    },
  },
})
