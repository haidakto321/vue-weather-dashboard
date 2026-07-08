import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { fetchHourlyForecast } from '@/lib/openMeteo'
import type { SavedCity } from '@/types/weather'

// Direct sibling of useForecast: Vue Query owns loading/error/cache/refetch for a city's
// hourly forecast. The city argument is MaybeRefOrGetter so callers can pass a plain value,
// a ref, a computed, or a getter - toValue() unwraps all of them, keeping the composable
// reactive to whichever source the caller uses (DATA-04).
export function useHourlyForecast(city: MaybeRefOrGetter<SavedCity | undefined>) {
  return useQuery({
    // Computed queryKey: when the resolved city changes, the key changes and Vue Query
    // refetches - this is what makes the hourly chart react to the selected city (CHRT-05).
    // An undefined key part while unresolved is fine because the query is disabled then.
    queryKey: computed(() => ['hourly', toValue(city)?.key]),
    queryFn: ({ signal }) => {
      // enabled (below) guarantees a city at runtime, but TypeScript cannot narrow across
      // that gate - so we re-check and throw instead of asserting with `!`.
      const c = toValue(city)
      if (!c) throw new Error('useHourlyForecast: query must stay disabled without a city')
      // The fetch uses the resolved city's stored lat/lon, never the raw route param (T-06-03).
      // signal comes from Vue Query so superseded/unmounted fetches abort.
      return fetchHourlyForecast(c.latitude, c.longitude, signal)
    },
    // The gate: no city resolved -> no request. This stops any fetch from firing before a
    // deep-linked route param resolves to a saved city (DATA-04 / T-06-03).
    enabled: computed(() => !!toValue(city)),
    // 5 min: revisiting a city does not refetch immediately - shows the cache working.
    staleTime: 5 * 60 * 1000,
  })
}
