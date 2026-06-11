import { createRouter, createWebHistory } from 'vue-router'

import DashboardPage from '@/pages/DashboardPage.vue'
import CityDetailPage from '@/pages/CityDetailPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

// Three named routes for the walking skeleton. City Detail takes an :id param that
// later phases will use to load a specific city; this phase just renders the page.
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardPage },
    { path: '/city/:id', name: 'city-detail', component: CityDetailPage },
    { path: '/settings', name: 'settings', component: SettingsPage },
  ],
})

export default router
