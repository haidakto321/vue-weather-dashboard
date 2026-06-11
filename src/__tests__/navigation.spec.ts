import { describe, it, expect, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from '@/App.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import CityDetailPage from '@/pages/CityDetailPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

// ResizeObserver is not implemented in jsdom but Vuetify components reference it.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // Vuetify reads matchMedia for display breakpoints.
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

function buildRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: DashboardPage },
      { path: '/city/:id', name: 'city-detail', component: CityDetailPage },
      { path: '/settings', name: 'settings', component: SettingsPage },
    ],
  })
}

function mountApp(router: Router) {
  const vuetify = createVuetify({ components, directives })
  return mount(App, {
    global: {
      plugins: [router, vuetify],
    },
  })
}

describe('navigation (E2E)', () => {
  it('renders the Dashboard page initially', async () => {
    const router = buildRouter()
    router.push('/')
    await router.isReady()
    const wrapper = mountApp(router)
    await flushPromises()
    expect(wrapper.text()).toContain('Dashboard')
  })

  it('swaps the rendered page when navigating between routes', async () => {
    const router = buildRouter()
    router.push('/')
    await router.isReady()
    const wrapper = mountApp(router)
    await flushPromises()

    await router.push('/settings')
    await flushPromises()
    expect(wrapper.text()).toContain('Settings')

    await router.push('/city/tokyo')
    await flushPromises()
    expect(wrapper.text()).toContain('City Detail')
  })

  it('highlights the active drawer item for the current route', async () => {
    const router = buildRouter()
    router.push('/settings')
    await router.isReady()
    const wrapper = mountApp(router)
    await flushPromises()

    // Vuetify marks the active router-linked list item with v-list-item--active.
    const activeItems = wrapper.findAll('.v-list-item--active')
    expect(activeItems.length).toBeGreaterThan(0)
    const activeText = activeItems.map((i) => i.text()).join(' ')
    expect(activeText).toContain('Settings')
  })

  it('navigates by clicking a drawer link', async () => {
    const router = buildRouter()
    router.push('/')
    await router.isReady()
    const wrapper = mountApp(router)
    await flushPromises()

    const settingsLink = wrapper
      .findAll('.v-list-item')
      .find((item) => item.text().includes('Settings'))
    expect(settingsLink).toBeTruthy()

    await settingsLink!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Settings')
  })
})
