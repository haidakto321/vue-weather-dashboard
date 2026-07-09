import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'

import { useMyLocation } from '@/composables/useMyLocation'
import { useCitiesStore } from '@/stores/cities'

// jsdom ships with no Geolocation API at all, so every test installs its own shim on
// globalThis.navigator.geolocation before exercising useMyLocation (same shim-per-test
// pattern the rest of the suite uses for ResizeObserver/matchMedia).
describe('useMyLocation', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: {
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
        getCurrentPosition: vi.fn(),
      },
      configurable: true,
      writable: true,
    })
  })

  it('a successful fix adds a static My Location city and clears errorKind', async () => {
    const geolocation = globalThis.navigator.geolocation as unknown as {
      watchPosition: ReturnType<typeof vi.fn>
    }
    geolocation.watchPosition.mockImplementation((success: PositionCallback) => {
      success({
        coords: {
          latitude: 51.5,
          longitude: -0.12,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition)
      return 1
    })

    const { locating, errorKind, locate } = useMyLocation()
    locate()
    await nextTick()

    const store = useCitiesStore()
    expect(store.cities).toHaveLength(1)
    expect(store.cities[0].id).toBe(0)
    expect(store.cities[0].name).toBe('My Location')
    expect(store.cities[0].latitude).toBe(51.5)
    expect(store.cities[0].longitude).toBe(-0.12)
    expect(errorKind.value).toBeNull()
    expect(locating.value).toBe(false)
  })

  it('permission-denied (code 1) sets errorKind to denied and adds no city', async () => {
    const geolocation = globalThis.navigator.geolocation as unknown as {
      watchPosition: ReturnType<typeof vi.fn>
    }
    geolocation.watchPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: 'denied' } as GeolocationPositionError)
        return 1
      },
    )

    const { errorKind, locate } = useMyLocation()
    locate()
    await nextTick()

    expect(errorKind.value).toBe('denied')
    expect(useCitiesStore().cities).toHaveLength(0)
  })

  it('position-unavailable (code 2) sets errorKind to unavailable and adds no city', async () => {
    const geolocation = globalThis.navigator.geolocation as unknown as {
      watchPosition: ReturnType<typeof vi.fn>
    }
    geolocation.watchPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 2, message: 'unavailable' } as GeolocationPositionError)
        return 1
      },
    )

    const { errorKind, locate } = useMyLocation()
    locate()
    await nextTick()

    expect(errorKind.value).toBe('unavailable')
    expect(useCitiesStore().cities).toHaveLength(0)
  })

  it('an unsupported browser sets errorKind to unsupported without calling watchPosition', () => {
    const geolocation = globalThis.navigator.geolocation as unknown as {
      watchPosition: ReturnType<typeof vi.fn>
    }
    // Simulate a browser with no Geolocation API at all.
    delete (globalThis.navigator as { geolocation?: unknown }).geolocation

    const { errorKind, locate } = useMyLocation()
    locate()

    expect(errorKind.value).toBe('unsupported')
    expect(geolocation.watchPosition).not.toHaveBeenCalled()
  })
})
