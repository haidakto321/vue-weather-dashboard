<script setup lang="ts">
import { computed } from 'vue'
import { isAxiosError } from 'axios'

import { useCurrentWeather } from '@/composables/useCurrentWeather'
import { useTemperature } from '@/composables/useTemperature'
import { wmoToCondition } from '@/lib/wmo'
import { useCitiesStore } from '@/stores/cities'
import type { SavedCity } from '@/types/weather'

const props = defineProps<{ city: SavedCity }>()

const store = useCitiesStore()

// Unit-aware temperature display; wind/humidity stay as-is (the toggle is temperature only).
const { format } = useTemperature()

// Vue Query owns this card's loading/error/content + caching, keyed by city.key.
const { data, isPending, isError, error } = useCurrentWeather(props.city)

// wmoToCondition turns the WMO code into a human label + mdi icon.
const condition = computed(() =>
  data.value ? wmoToCondition(data.value.weatherCode) : null,
)

const subtitle = computed(() =>
  [props.city.admin1, props.city.country].filter(Boolean).join(', '),
)

// Distinguish "city not found" (404) from a network/other failure (D-08). Never render
// the raw error object.
const errorMessage = computed(() => {
  const e = error.value
  if (isAxiosError(e) && e.response?.status === 404) {
    return 'City not found.'
  }
  return 'Could not load weather - check your connection.'
})

function remove() {
  store.removeCity(props.city.key)
}
</script>

<template>
  <!-- The whole card links to the city's detail route (NAV-02). The remove button uses
       @click.stop so removing a card does not also trigger navigation. -->
  <v-card
    :to="{ name: 'city-detail', params: { id: String(city.id) } }"
    :aria-label="`View forecast for ${city.name}`"
  >
    <v-card-title class="d-flex align-center">
      <span>{{ city.name }}</span>
      <v-spacer />
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        :aria-label="`Remove ${city.name}`"
        @click.stop="remove"
      />
    </v-card-title>
    <v-card-subtitle v-if="subtitle">{{ subtitle }}</v-card-subtitle>

    <v-card-text>
      <!-- Loading (D-07) -->
      <v-skeleton-loader v-if="isPending" type="list-item-two-line" />

      <!-- Error (D-08) -->
      <v-alert v-else-if="isError" type="error" variant="tonal" density="compact">
        {{ errorMessage }}
      </v-alert>

      <!-- Content -->
      <template v-else-if="data && condition">
        <div class="d-flex align-center mb-2">
          <v-icon :icon="condition.icon" size="40" class="mr-3" />
          <div>
            <div class="text-h4">{{ format(data.temperature) }}</div>
            <div class="text-body-2">{{ condition.label }}</div>
          </div>
        </div>
        <div class="d-flex ga-4 text-body-2">
          <span>
            <v-icon icon="mdi-weather-windy" size="small" />
            {{ Math.round(data.windSpeed) }} km/h
          </span>
          <span>
            <v-icon icon="mdi-water-percent" size="small" />
            {{ data.humidity }}%
          </span>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
