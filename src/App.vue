<script setup lang="ts">
import AppShell from '@/layouts/AppShell.vue'
import { useThemePreference } from '@/composables/useThemePreference'
import { useLanguagePreference } from '@/composables/useLanguagePreference'

// AppShell provides the app bar + navigation drawer and renders the current route.

// Bind the persisted theme preference to Vuetify's active theme once, at the app root, so
// the store <-> Vuetify sync (apply-on-load + live switching) is active for every route.
// Pinia is registered before App mounts (see main.ts), so reading the store here is safe.
useThemePreference()

// Likewise bind the persisted language preference to vue-i18n's active locale once here, so
// switching language in Settings updates every route's text live and survives a reload.
useLanguagePreference()
</script>

<template>
  <AppShell />
</template>
