<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCurrentWeather } from '@/composables/useCurrentWeather'
import { useTemperature } from '@/composables/useTemperature'
import { useWindSpeed } from '@/composables/useWindSpeed'
import { wmoToCondition } from '@/lib/wmo'
import { useCitiesStore } from '@/stores/cities'
import type { SavedCity } from '@/types/weather'

const props = defineProps<{ city: SavedCity }>()

const store = useCitiesStore()

const { t, locale } = useI18n()

// Unit-aware temperature/wind display; humidity stays as-is (no unit toggle for it).
const { format } = useTemperature()
const { format: formatWind } = useWindSpeed()

// Vue Query owns this card's loading/error/content + caching, keyed by city.key.
// Pass a GETTER, not props.city itself: a plain value would snapshot the prop, so a
// changed prop would never re-key the query. The getter keeps it reactive (DATA-04).
// refetch comes free from Vue Query - it powers the retry button below (DATA-05).
// dataUpdatedAt/isRefetching are already returned by every useQuery result (Pattern 5) -
// no new fetch logic, they power the last-updated label + refresh button below (DATA-06).
const { data, isPending, isError, refetch, dataUpdatedAt, isRefetching } = useCurrentWeather(
  () => props.city,
)

// wmoToCondition turns the WMO code into a human label + mdi icon.
const condition = computed(() =>
  data.value ? wmoToCondition(data.value.weatherCode) : null,
)

const subtitle = computed(() =>
  [props.city.admin1, props.city.country].filter(Boolean).join(', '),
)

// The geolocation-added city's stored name is a static English literal ("My Location" -
// GEO-01); the render site shows the localized label instead of that raw string.
const displayName = computed(() =>
  props.city.id === 0 ? t('geo.myLocation') : props.city.name,
)

// Map the app locale ('en'/'ja') to a BCP-47 tag, copied verbatim from ForecastList so the
// last-updated label localizes identically to the rest of the app.
const dateLocale = computed(() => (locale.value === 'ja' ? 'ja-JP' : 'en-GB'))

// dataUpdatedAt is an epoch-ms timestamp Vue Query already tracks per-query - no hand-rolled
// "last updated" bookkeeping.
const lastUpdatedLabel = computed(() =>
  dataUpdatedAt.value
    ? new Date(dataUpdatedAt.value).toLocaleTimeString(dateLocale.value, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '',
)

// sunrise/sunset are local-wall-clock ISO datetime strings (WITH a time component), so
// `new Date(iso)` already parses them as local time - only formatting is needed here.
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(dateLocale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function remove() {
  store.removeCity(props.city.key)
}
</script>

<template>
  <!-- The whole card links to the city's detail route (NAV-02). The remove button uses
       @click.stop so removing a card does not also trigger navigation. -->
  <v-card
    data-testid="weather-card"
    :to="{ name: 'city-detail', params: { id: city.key } }"
    :aria-label="t('card.viewForecast', { city: city.name })"
  >
    <v-card-title class="d-flex align-center">
      <span>{{ displayName }}</span>
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
            {{ formatWind(data.windSpeed) }}
          </span>
          <span>
            <v-icon icon="mdi-water-percent" size="small" />
            {{ t('card.humidity', { value: data.humidity }) }}
          </span>
        </div>
        <div class="d-flex ga-4 text-body-2 flex-wrap mt-2">
          <span>{{ t('card.feelsLike', { value: format(data.feelsLike) }) }}</span>
          <span>
            {{ t('card.precipitation', { value: Math.round(data.precipitation * 10) / 10 }) }}
          </span>
          <span>{{ t('card.uvIndex', { value: Math.round(data.uvIndex) }) }}</span>
        </div>
        <div class="d-flex ga-4 text-body-2 flex-wrap mt-2">
          <span>{{ t('card.sunrise', { value: formatTime(data.sunrise) }) }}</span>
          <span>{{ t('card.sunset', { value: formatTime(data.sunset) }) }}</span>
        </div>
        <div class="d-flex align-center ga-2 text-caption text-medium-emphasis mt-2">
          <span>{{ t('card.lastUpdated', { time: lastUpdatedLabel }) }}</span>
          <v-btn
            :icon="isRefetching ? 'mdi-loading mdi-spin' : 'mdi-refresh'"
            size="x-small"
            variant="text"
            :disabled="isRefetching"
            :aria-label="t('card.refresh')"
            @click.stop.prevent="refetch()"
          />
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
