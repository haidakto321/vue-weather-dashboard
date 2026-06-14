<script setup lang="ts">
import AppShell from '@/layouts/AppShell.vue'
import { useThemePreference } from '@/composables/useThemePreference'

// AppShell provides the app bar + navigation drawer and renders the current route.

// Bind the persisted theme preference to Vuetify's active theme once, at the app root, so
// the store <-> Vuetify sync (apply-on-load + live switching) is active for every route.
// Pinia is registered before App mounts (see main.ts), so reading the store here is safe.
useThemePreference()
</script>

<template>
  <AppShell />
</template>
