<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { isTrustedOrigin } from '@/lib/widgetMessages'
import { useCitiesStore } from '@/stores/cities'
import { usePreferencesStore } from '@/stores/preferences'
import type { SavedCityLite, WidgetInitMessage } from '@/types/widgetMessages'

const citiesStore = useCitiesStore()
const preferencesStore = usePreferencesStore()
const { t } = useI18n()

// Falls back to the widget project's fixed dev port so this works with zero
// setup; VITE_WIDGET_URL overrides it if the widget is ever served elsewhere.
const widgetUrl = (import.meta.env.VITE_WIDGET_URL as string | undefined) ?? 'http://localhost:5174'
const widgetOrigin = new URL(widgetUrl).origin

const iframeRef = ref<HTMLIFrameElement | null>(null)
// The widget only sends 'widget:ready' once, on its own mount - which usually happens
// before the user has searched for any city. Track handshake completion so a later
// citiesStore.cities change (add/remove/reorder) can push a fresh widget:init too, not
// just the one-time reply.
const widgetHandshakeDone = ref(false)

function toLite(
  cities: {
    key: string
    name: string
    latitude: number
    longitude: number
    admin1?: string
    country?: string
  }[],
): SavedCityLite[] {
  return cities.map((c) => ({
    key: c.key,
    name: c.name,
    latitude: c.latitude,
    longitude: c.longitude,
    admin1: c.admin1,
    country: c.country,
  }))
}

function sendInit() {
  const initMessage: WidgetInitMessage = {
    type: 'widget:init',
    cities: toLite(citiesStore.cities),
    defaultCityKey: preferencesStore.defaultCityKey,
  }
  iframeRef.value?.contentWindow?.postMessage(initMessage, widgetOrigin)
}

function handleMessage(event: MessageEvent) {
  if (!isTrustedOrigin(event.origin, widgetOrigin)) return

  const data = event.data as { type?: unknown; cityKey?: unknown } | null
  if (!data || typeof data.type !== 'string') return

  if (data.type === 'widget:ready') {
    widgetHandshakeDone.value = true
    sendInit()
    return
  }

  if (data.type === 'widget:set-default' && typeof data.cityKey === 'string') {
    const exists = citiesStore.cities.some((c) => c.key === data.cityKey)
    if (exists) preferencesStore.setDefaultCity(data.cityKey)
  }
}

// Re-push the city list any time it changes AFTER the initial handshake - the widget has
// no other way to learn about a city added/removed/reordered after it first loaded.
watch(
  () => citiesStore.cities,
  () => {
    if (widgetHandshakeDone.value) sendInit()
  },
  { deep: true },
)

onMounted(() => window.addEventListener('message', handleMessage))
onUnmounted(() => window.removeEventListener('message', handleMessage))
</script>

<template>
  <v-card class="mb-4">
    <v-card-title>{{ t('dashboard.widgetHeading') }}</v-card-title>
    <v-card-text class="pa-0">
      <iframe
        ref="iframeRef"
        :src="widgetUrl"
        title="Default location widget"
        sandbox="allow-scripts allow-same-origin"
        style="width: 100%; height: 220px; border: none"
        data-testid="default-location-widget-frame"
      />
    </v-card-text>
  </v-card>
</template>
