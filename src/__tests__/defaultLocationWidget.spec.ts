import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia, type Pinia } from 'pinia'

import DefaultLocationWidget from '@/components/DefaultLocationWidget.vue'
import { i18n } from '@/i18n'
import { useCitiesStore } from '@/stores/cities'
import { usePreferencesStore } from '@/stores/preferences'

// jsdom does not implement ResizeObserver and ships only a partial matchMedia, both of
// which Vuetify touches. Same shim as the other Vuetify component specs.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.matchMedia =
    globalThis.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false
        },
      }) as unknown as MediaQueryList)
})

// Matches the component's fallback default (no VITE_WIDGET_URL set in the test env).
const WIDGET_ORIGIN = 'http://localhost:5174'

let pinia: Pinia

function mountWidget() {
  const vuetify = createVuetify({ components, directives })
  return mount(DefaultLocationWidget, {
    global: { plugins: [vuetify, pinia, i18n] },
  })
}

function dispatchMessage(origin: string, data: unknown) {
  window.dispatchEvent(new MessageEvent('message', { origin, data }))
}

describe('DefaultLocationWidget', () => {
  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)

    useCitiesStore().addCity({
      id: 2643743,
      name: 'London',
      latitude: 51.5085,
      longitude: -0.1257,
      country: 'United Kingdom',
      admin1: 'England',
    })
  })

  it('ignores a widget:set-default message from an untrusted origin', () => {
    mountWidget()
    const prefs = usePreferencesStore()

    dispatchMessage('http://evil.example', { type: 'widget:set-default', cityKey: '2643743' })

    expect(prefs.defaultCityKey).toBeNull()
  })

  it('sets the default city on a trusted message referencing a known city', () => {
    mountWidget()
    const prefs = usePreferencesStore()

    dispatchMessage(WIDGET_ORIGIN, { type: 'widget:set-default', cityKey: '2643743' })

    expect(prefs.defaultCityKey).toBe('2643743')
  })

  it('rejects a trusted message referencing an unknown city key', () => {
    mountWidget()
    const prefs = usePreferencesStore()

    dispatchMessage(WIDGET_ORIGIN, { type: 'widget:set-default', cityKey: 'does-not-exist' })

    expect(prefs.defaultCityKey).toBeNull()
  })
})
