// One-shot "use my location" fix: wraps VueUse's useGeolocation (a continuous watch under
// the hood) into a single-fix flow, then hands the coordinates straight to the cities store.
// Open-Meteo has no reverse-geocoding endpoint (lat/lon -> place name), so the saved city uses
// a static, i18n-labeled name ('My Location') instead of a derived place name (GEO-01).
import { ref, watch } from 'vue'
import { useGeolocation } from '@vueuse/core'
import { useCitiesStore } from '@/stores/cities'

// The three failure states the button needs to render (idle/locating is covered separately
// by the `locating` flag).
export type MyLocationErrorKind = 'denied' | 'unavailable' | 'unsupported'

export function useMyLocation() {
  const store = useCitiesStore()
  // immediate: false - nothing runs until locate() calls resume(). resume() starts a
  // CONTINUOUS navigator.geolocation.watchPosition, not a one-shot getCurrentPosition, so the
  // watch below must call pause() itself on the first fix or error (Pitfall 1).
  const { isSupported, coords, error, resume, pause } = useGeolocation({ immediate: false })

  const locating = ref(false)
  const errorKind = ref<MyLocationErrorKind | null>(null)

  // React to a fix or an error while a locate() attempt is in flight; ignore any stray
  // updates outside that window.
  watch([coords, error], () => {
    if (!locating.value) return

    // coords starts as { latitude: Infinity, longitude: Infinity, ... } before any fix -
    // Infinity is truthy, so this MUST be a finite check, never a truthiness check (Pitfall 2).
    if (Number.isFinite(coords.value.latitude)) {
      pause() // one-shot: stop the continuous watch once a fix arrives.
      locating.value = false
      errorKind.value = null
      // id: 0 relies on the store's existing cityKey() fallback to a lat,lon,name composite
      // key - already globally unique per fix, no store change needed for dedupe.
      store.addCity({
        id: 0,
        name: 'My Location', // i18n-keyed at the render site via t('geo.myLocation')
        latitude: coords.value.latitude,
        longitude: coords.value.longitude,
        country: '',
      })
    } else if (error.value) {
      pause()
      locating.value = false
      // MDN GeolocationPositionError: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE,
      // 3 = TIMEOUT. Both non-permission codes map to the same generic 'unavailable' message.
      errorKind.value = error.value.code === 1 ? 'denied' : 'unavailable'
    }
  })

  function locate() {
    if (!isSupported.value) {
      errorKind.value = 'unsupported'
      return
    }
    errorKind.value = null
    locating.value = true
    resume()
  }

  return { locating, errorKind, locate }
}
