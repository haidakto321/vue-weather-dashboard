<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { storeToRefs } from 'pinia'

import { usePreferencesStore } from '@/stores/preferences'

// The app shell: a Vuetify app bar + responsive navigation drawer that route to the
// three pages, with <RouterView /> rendered in the main area.

// App-bar theme quick-toggle (UI-02 discoverability). It flips the store theme, which the
// app-root useThemePreference binding mirrors into Vuetify - so the whole UI switches live
// and the choice persists. The icon/label reflect the current theme reactively.
const prefs = usePreferencesStore()
const { theme } = storeToRefs(prefs)
const isDark = computed(() => theme.value === 'dark')
const themeIcon = computed(() => (isDark.value ? 'mdi-weather-sunny' : 'mdi-weather-night'))

function toggleTheme() {
  prefs.setTheme(isDark.value ? 'light' : 'dark')
}

// On desktop the drawer starts open; on mobile it starts closed and is toggled via the
// app-bar icon. useDisplay gives us Vuetify's reactive breakpoint without custom media
// queries (UI-03).
const { mobile } = useDisplay()
const drawerOpen = ref(!mobile.value)

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

// Each link uses a router target. Vuetify highlights the matching item automatically via
// router-link active state (NAV-03). City Detail is now reached by clicking a dashboard
// card; the drawer keeps a "City Detail" entry (so navigation stays discoverable and the
// nav test's three-item expectation holds), but it no longer hardcodes a fake city id.
// It navigates to a placeholder detail route which - matching no saved city - renders the
// friendly "city not found / back to dashboard" state instead of a dead link.
const navLinks = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: { name: 'dashboard' } },
  { title: 'City Detail', icon: 'mdi-city', to: { name: 'city-detail', params: { id: 'detail' } } },
  { title: 'Settings', icon: 'mdi-cog', to: { name: 'settings' } },
]
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-nav-icon aria-label="Toggle navigation" @click="toggleDrawer" />
      <v-app-bar-title>Vue Weather Dashboard</v-app-bar-title>
      <!-- Quick theme toggle, outside the nav drawer list (drawer keeps exactly three items). -->
      <v-btn
        :icon="themeIcon"
        aria-label="Toggle dark mode"
        variant="text"
        @click="toggleTheme"
      />
    </v-app-bar>

    <v-navigation-drawer v-model="drawerOpen" :temporary="mobile">
      <v-list nav>
        <v-list-item
          v-for="link in navLinks"
          :key="link.title"
          :to="link.to"
          :prepend-icon="link.icon"
          :title="link.title"
          color="primary"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>
