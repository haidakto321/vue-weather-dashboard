<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCurrentWeather } from '@/composables/useCurrentWeather'
import { useTemperature } from '@/composables/useTemperature'
import { wmoToCondition } from '@/lib/wmo'
import { useCitiesStore } from '@/stores/cities'
import type { SavedCity } from '@/types/weather'

const props = defineProps<{ city: SavedCity }>()

const store = useCitiesStore()

const { t } = useI18n()

// Unit-aware temperature display; wind/humidity stay as-is (the toggle is temperature only).
const { format } = useTemperature()

// Vue Query owns this card's loading/error/content + caching, keyed by city.key.
// Pass a GETTER, not props.city itself: a plain value would snapshot the prop, so a
// changed prop would never re-key the query. The getter keeps it reactive (DATA-04).
// refetch comes free from Vue Query - it powers the retry button below (DATA-05).
const { data, isPending, isError, refetch } = useCurrentWeather(() => props.city)

// wmoToCondition turns the WMO code into a human label + mdi icon.
const condition = computed(() =>
  data.value ? wmoToCondition(data.value.weatherCode) : null,
)

const subtitle = computed(() =>
  [props.city.admin1, props.city.country].filter(Boolean).join(', '),
)

function remove() {
  store.removeCity(props.city.key)
}
</script>

<template>
  <!-- The whole card links to the city's detail route (NAV-02). The remove button uses
       @click.stop so removing a card does not also trigger navigation. -->
  <v-card
    :to="{ name: 'city-detail', params: { id: String(city.id) } }"
    :aria-label="t('card.viewForecast', { city: city.name })"
  >
    <v-card-title class="d-flex align-center">
      <span>{{ city.name }}</span>
      <v-spacer />
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        :aria-label="t('card.remove', { city: city.name })"
        @click.stop="remove"
      />
    </v-card-title>
    <v-card-subtitle v-if="subtitle">{{ subtitle }}</v-card-subtitle>

    <v-card-text>
      <!-- Loading (D-07) -->
      <v-skeleton-loader v-if="isPending" type="list-item-two-line" />

      <!-- Error (D-08): generic copy only, never the raw error object. This copy is now
           accurate for every failure - Open-Meteo signals "city not found" via empty
           geocoder results at search time, never via a coordinate-fetch status here. -->
      <v-alert v-else-if="isError" type="error" variant="tonal" density="compact">
        {{ t('card.loadError') }}
        <template #append>
          <!-- Retry (DATA-05): .stop.prevent because the card root is a router-link -
               retrying must refetch, not navigate (same idea as the remove button). -->
          <v-btn size="small" variant="text" @click.stop.prevent="refetch()">
            {{ t('card.retry') }}
          </v-btn>
        </template>
      </v-alert>

      <!-- Content -->
      <template v-else-if="data && condition">
        <div class="d-flex align-center mb-2">
          <v-icon :icon="condition.icon" size="40" class="mr-3" />
          <div>
            <div class="text-h4">{{ format(data.temperature) }}</div>
            <div class="text-body-2">{{ t(condition.labelKey) }}</div>
          </div>
        </div>
        <div class="d-flex ga-4 text-body-2">
          <span>
            <v-icon icon="mdi-weather-windy" size="small" />
            {{ t('card.wind', { value: Math.round(data.windSpeed) }) }}
          </span>
          <span>
            <v-icon icon="mdi-water-percent" size="small" />
            {{ t('card.humidity', { value: data.humidity }) }}
          </span>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
