import { createRouter, createWebHistory } from 'vue-router'

// Route-level code splitting: every route's component is a `() => import(...)` factory, so
// Vite emits ONE separate JS chunk per page file (DashboardPage, CityDetailPage, SettingsPage,
// NotFoundPage) and the browser only downloads a page's code when that route is first visited.
// The dashboard is lazy too for consistency - Vite modulepreloads the entry route's chunk
// anyway, so the initial load pays no real penalty. City Detail takes an :id param used to
// look up a saved city.
// The catch-all route MUST be LAST: '/:pathMatch(.*)*' matches any URL none of the routes
// above claimed, sending unknown paths to the friendly NotFoundPage instead of a blank screen.
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue') },
    { path: '/city/:id', name: 'city-detail', component: () => import('@/pages/CityDetailPage.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/pages/SettingsPage.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue') },
  ],
})

export default router
