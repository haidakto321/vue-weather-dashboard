import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia, type Pinia } from 'pinia'

import SettingsPage from '@/pages/SettingsPage.vue'
// Install the real app i18n instance so t(...) resolves to the en catalogue and a language
// change drives the same store -> locale path the running app uses.
import { i18n } from '@/i18n'
import { usePreferencesStore } from '@/stores/preferences'

// The required component test (TEST-03). It is the third representative test of the phase
// (store = preferences in 04-01, composable = useTemperature in 04-01, component = this), and
// proves the Settings page works end to end with the REAL preferences store + i18n:
// controls render, reflect the store defaults on mount, and a control change updates the
// store (and, for language, the rendered text).

// jsdom lacks ResizeObserver and ships only a partial matchMedia, both of which Vuetify
// touches; install no-op shims so Vuetify components mount cleanly (same as cityDetail.spec).
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

let pinia: Pinia

function mountSettings() {
  const vuetify = createVuetify({ components, directives })
  // SettingsPage needs no router; install Vuetify + the seeded Pinia + i18n.
  return mount(SettingsPage, {
    global: {
      plugins: [vuetify, pinia, i18n],
    },
  })
}

describe('SettingsPage (component)', () => {
  beforeEach(() => {
    // Clear persisted prefs first so every test starts from the defaults, then a fresh Pinia
    // (the store reads localStorage at creation). Reset the i18n locale to the default too so
    // the language test starts from English regardless of test order.
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
    i18n.global.locale.value = 'en'
  })

  it('renders the unit, theme, and language controls without throwing', () => {
    const wrapper = mountSettings()

    expect(wrapper.find('[data-testid="unit-toggle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="wind-unit-toggle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="theme-switch"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="language-toggle"]').exists()).toBe(true)
  })

  it('reflects the preferences-store defaults on mount', () => {
    const store = usePreferencesStore()
    const wrapper = mountSettings()

    // Defaults from DEFAULT_PREFERENCES (04-01): celsius / light / en.
    expect(store.unit).toBe('celsius')
    expect(store.theme).toBe('light')
    expect(store.language).toBe('en')

    // The heading renders the en catalogue's settings.heading.
    expect(wrapper.text()).toContain('Settings')
  })

  it('changing the language control updates the store, and the active locale drives the text', async () => {
    const store = usePreferencesStore()
    const wrapper = mountSettings()

    // Page starts in English: the language section heading is the en string.
    expect(wrapper.text()).toContain('Language')

    // Find the Japanese option button inside the language toggle and click it. Asserting the
    // STORE state is more robust than poking deep Vuetify internals.
    const languageToggle = wrapper.find('[data-testid="language-toggle"]')
    const jaButton = languageToggle
      .findAll('button')
      .find((b) => b.text().includes('日本語'))
    expect(jaButton).toBeTruthy()

    await jaButton!.trigger('click')

    // The control drove setLanguage -> the persisted store is now Japanese.
    expect(store.language).toBe('ja')

    // In the running app the App-root useLanguagePreference binding mirrors the store language
    // into vue-i18n's active locale. This test mounts SettingsPage in isolation (no App.vue),
    // so drive that one step explicitly, then prove the page text follows the active locale:
    // settings.heading renders 設定 in Japanese.
    i18n.global.locale.value = store.language
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('設定')
  })

  it('changing the unit control updates the preferences store', async () => {
    const store = usePreferencesStore()
    const wrapper = mountSettings()

    expect(store.unit).toBe('celsius')

    const unitToggle = wrapper.find('[data-testid="unit-toggle"]')
    const fahrenheitButton = unitToggle
      .findAll('button')
      .find((b) => b.text().includes('°F'))
    expect(fahrenheitButton).toBeTruthy()

    await fahrenheitButton!.trigger('click')

    expect(store.unit).toBe('fahrenheit')
  })

  it('changing the wind-unit control updates the preferences store', async () => {
    const store = usePreferencesStore()
    const wrapper = mountSettings()

    expect(store.windUnit).toBe('kmh')

    const windUnitToggle = wrapper.find('[data-testid="wind-unit-toggle"]')
    const mphButton = windUnitToggle
      .findAll('button')
      .find((b) => b.text().includes('mph'))
    expect(mphButton).toBeTruthy()

    await mphButton!.trigger('click')

    expect(store.windUnit).toBe('mph')
  })
})
