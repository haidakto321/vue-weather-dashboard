import { useQuery } from '@tanstack/vue-query'

import { fetchForecast } from '@/lib/openMeteo'
import type { SavedCity } from '@/types/weather'

// Vue Query = server state: it owns loading/error/cache/refetch for a city's multi-day
// forecast. Keyed by city.key so each city caches independently - and so navigating to a
// different city changes the query key and refetches, which is what makes the detail
// page's list and chart react to the selected city (CHRT-02).
export function useForecast(city: SavedCity) {
  return useQuery({
    queryKey: ['forecast', city.key],
    // signal comes from Vue Query so superseded/unmounted fetches abort.
    queryFn: ({ signal }) => fetchForecast(city.latitude, city.longitude, 7, signal),
    // 5 min: revisiting a city does not refetch immediately - shows the cache working.
    staleTime: 5 * 60 * 1000,
  })
}
