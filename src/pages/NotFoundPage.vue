<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// The router's catch-all route renders this page for ANY unknown URL.
// SECURITY: the unknown path is fully user-controlled input, so we deliberately never read
// or display route.params - the page shows only static, translated copy, escaped by Vue.
const { t } = useI18n()
</script>

<template>
  <section class="pa-4">
    <h1 class="text-h4 mb-2">{{ t('notFound.title') }}</h1>
    <p class="mb-4 text-medium-emphasis">{{ t('notFound.body') }}</p>
    <v-btn :to="{ name: 'dashboard' }" color="primary" prepend-icon="mdi-arrow-left">
      {{ t('notFound.backToDashboard') }}
    </v-btn>
  </section>
</template>
