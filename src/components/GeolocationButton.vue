<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useMyLocation } from '@/composables/useMyLocation'

// Self-contained: owns its own composable instance, no props/emits. Not wired into any page
// yet - Plan 07-06 imports this into DashboardPage.vue.
const { t } = useI18n()
const { locating, errorKind, locate } = useMyLocation()
</script>

<template>
  <div>
    <v-btn
      data-testid="geo-button"
      prepend-icon="mdi-crosshairs-gps"
      variant="tonal"
      color="primary"
      :loading="locating"
      :aria-label="t('geo.useMyLocation')"
      @click="locate"
    >
      {{ t('geo.useMyLocation') }}
    </v-btn>
    <!-- errorKind's three possible values (denied/unavailable/unsupported) map directly to
         the geo.denied/geo.unavailable/geo.unsupported keys. -->
    <v-alert v-if="errorKind" type="error" variant="tonal" density="compact" class="mt-2">
      {{ t(`geo.${errorKind}`) }}
    </v-alert>
  </div>
</template>
