import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { fetchCurrentWeather } from '@/lib/openMeteo'
import type { SavedCity } from '@/types/weather'

// Vue Query = server state: it owns loading/error/cache/refetch for each city's current
// weather. The city argument is MaybeRefOrGetter so callers can pass a plain value, a
// ref, a computed, or a getter - toValue() unwraps all of them, keeping the composable
// reactive to whichever source the caller uses (DATA-04).
export function useCurrentWeather(city: MaybeRefOrGetter<SavedCity | undefined>) {
  return useQuery({
    // Computed queryKey: when the resolved city changes, the key changes and Vue Query
    // refetches - so every card caches independently and follows its prop.
    // An undefined key part while unresolved is fine because the query is disabled then.
    queryKey: computed(() => ['currentWeather', toValue(city)?.key]),
    queryFn: ({ signal }) => {
      // enabled (below) guarantees a city at runtime, but TypeScript cannot narrow across
      // that gate - so we re-check and throw instead of asserting with `!`.
      const c = toValue(city)
      if (!c) throw new Error('useCurrentWeather: query must stay disabled without a city')
      // signal comes from Vue Query so superseded/unmounted fetches abort.
      return fetchCurrentWeather(c.latitude, c.longitude, signal)
    },
    // The gate: no city resolved -> no request. This is what stops any fetch from firing
    // before a city is available.
    enabled: computed(() => !!toValue(city)),
    // 5 min: revisiting a city does not refetch immediately - shows the cache working.
    staleTime: 5 * 60 * 1000,
  })
}
