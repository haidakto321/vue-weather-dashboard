import { useQuery } from '@tanstack/vue-query'

import { fetchCurrentWeather } from '@/lib/openMeteo'
import type { SavedCity } from '@/types/weather'

// Vue Query = server state: it owns loading/error/cache/refetch for each city's
// current weather. Keyed by city.key so every card caches independently.
export function useCurrentWeather(city: SavedCity) {
  return useQuery({
    queryKey: ['currentWeather', city.key],
    // signal comes from Vue Query so superseded/unmounted fetches abort.
    queryFn: ({ signal }) => fetchCurrentWeather(city.latitude, city.longitude, signal),
    // 5 min: revisiting a city does not refetch immediately - shows the cache working.
    staleTime: 5 * 60 * 1000,
  })
}
