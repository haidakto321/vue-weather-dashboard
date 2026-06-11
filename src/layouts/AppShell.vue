<script setup lang="ts">
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

// The app shell: a Vuetify app bar + responsive navigation drawer that route to the
// three pages, with <RouterView /> rendered in the main area.

// On desktop the drawer starts open; on mobile it starts closed and is toggled via the
// app-bar icon. useDisplay gives us Vuetify's reactive breakpoint without custom media
// queries (UI-03).
const { mobile } = useDisplay()
const drawerOpen = ref(!mobile.value)

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

// Each link uses a router target. Vuetify highlights the matching item automatically via
// router-link active state (NAV-03). City Detail points at a concrete sample id so the
// link is navigable this phase.
const navLinks = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: { name: 'dashboard' } },
  { title: 'City Detail', icon: 'mdi-city', to: { name: 'city-detail', params: { id: 'tokyo' } } },
  { title: 'Settings', icon: 'mdi-cog', to: { name: 'settings' } },
]
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-nav-icon aria-label="Toggle navigation" @click="toggleDrawer" />
      <v-app-bar-title>Vue Weather Dashboard</v-app-bar-title>
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
