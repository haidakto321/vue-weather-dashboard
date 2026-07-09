<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import ForecastList from '@/components/ForecastList.vue'
import ForecastChart from '@/components/ForecastChart.vue'
import HourlyChart from '@/components/HourlyChart.vue'
import { useForecast } from '@/composables/useForecast'
import { useHourlyForecast } from '@/composables/useHourlyForecast'
import { useCurrentWeather } from '@/composables/useCurrentWeather'
import { useTemperature } from '@/composables/useTemperature'
import { useWindSpeed } from '@/composables/useWindSpeed'
import { wmoToCondition } from '@/lib/wmo'
import { useCitiesStore } from '@/stores/cities'
import type { DailyForecast, SavedCity } from '@/types/weather'

// Vue Router params decide which city is shown. The :id is user-controllable (deep link),
// so it is only ever used to LOOK UP an existing saved city - never to build a request.
const route = useRoute()
const store = useCitiesStore()

const { t, locale } = useI18n()

// Resolve the route param to a SavedCity reactively: a computed on params.id so changing
// :id (navigating to another city) re-resolves and re-keys the forecast query (CHRT-02).
const city = computed<SavedCity | undefined>(() => {
  const id = String(route.params.id)
  return store.cities.find((c) => String(c.id) === id || c.key === id)
})

const subtitle = computed(() =>
  city.value ? [city.value.admin1, city.value.country].filter(Boolean).join(', ') : '',
)

// The geolocation-added city's stored name is a static English literal ("My Location" -
// GEO-01); the render site shows the localized label instead of that raw string.
const displayName = computed(() =>
  city.value?.id === 0 ? t('geo.myLocation') : (city.value?.name ?? ''),
)

// Vue Query owns loading/error/cache for the forecast. The composable accepts the city
// computed directly (it may be undefined while the param has not resolved); its enabled
// guard keeps the query off until a saved city matches, so no request ever fires with
// placeholder data. This replaces the old getter-trap workaround wholesale (DATA-04).
// refetch comes free from Vue Query - it powers the retry button below (DATA-05).
const { data, isPending, isError, refetch } = useForecast(city)

const forecast = computed<DailyForecast | undefined>(() => data.value)

// Hourly forecast reuses the SAME resolved `city` computed - the untrusted route :id only
// ever selects a saved city, and the fetch uses that city's stored lat/lon, never the raw
// param (T-06-03). The composable's enabled guard means no hourly request fires before the
// param resolves to a saved city (DATA-04).
const { data: hourly } = useHourlyForecast(city)

// Current conditions reuse the SAME resolved `city` computed too - same untrusted-param
// discipline as the forecast/hourly calls above (T-06-03). This is the exact composable
// WeatherCard.vue already uses; no new fetch infrastructure (WTHR-04/DATA-06).
const {
  data: current,
  isPending: currentPending,
  isError: currentError,
  refetch: refetchCurrent,
  dataUpdatedAt,
  isRefetching,
} = useCurrentWeather(city)

// wmoToCondition turns the WMO code into a human label + mdi icon, same as WeatherCard.
const currentCondition = computed(() =>
  current.value ? wmoToCondition(current.value.weatherCode) : null,
)

const { format } = useTemperature()
const { format: formatWind } = useWindSpeed()

// Map the app locale ('en'/'ja') to a BCP-47 tag, copied verbatim from ForecastList so the
// last-updated/sunrise/sunset labels localize identically to the rest of the app.
const dateLocale = computed(() => (locale.value === 'ja' ? 'ja-JP' : 'en-GB'))

// dataUpdatedAt is an epoch-ms timestamp Vue Query already tracks per-query (Pattern 5) -
// no hand-rolled "last updated" bookkeeping.
const lastUpdatedLabel = computed(() =>
  dataUpdatedAt.value
    ? new Date(dataUpdatedAt.value).toLocaleTimeString(dateLocale.value, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '',
)

// sunrise/sunset are local-wall-clock ISO datetime strings (WITH a time component), so
// `new Date(iso)` already parses them as local time - only formatting is needed here (see
// interface note; unlike the date-ONLY string bug fixed in WR-01).
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(dateLocale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="pa-4">
    <!-- Not found: the param did not match any saved city. Friendly, no crash. -->
    <template v-if="!city">
      <h1 class="text-h4 mb-2">{{ t('detail.notFoundTitle') }}</h1>
      <p class="mb-4 text-medium-emphasis">
        {{ t('detail.notFoundBody') }}
      </p>
      <v-btn :to="{ name: 'dashboard' }" color="primary" prepend-icon="mdi-arrow-left">
        {{ t('detail.backToDashboard') }}
      </v-btn>
    </template>

    <!-- Matched a saved city: show its forecast. -->
    <template v-else>
      <h1 class="text-h4 mb-1">{{ displayName }}</h1>
      <p v-if="subtitle" class="text-medium-emphasis mb-4">{{ subtitle }}</p>

      <!-- Loading (DATA-03) -->
      <v-progress-circular v-if="isPending" indeterminate color="primary" class="my-6" />

      <!-- Error: generic inline message, never the raw error object. -->
      <v-alert v-else-if="isError" type="error" variant="tonal" density="compact">
        {{ t('detail.loadError') }}
        <template #append>
          <!-- Retry (DATA-05): refetch comes free from Vue Query's useQuery result. -->
          <v-btn size="small" variant="text" @click="refetch()">{{ t('detail.retry') }}</v-btn>
        </template>
      </v-alert>

      <!-- Content: forecast list + temperature chart, both reactive to the city. -->
      <template v-else-if="forecast">
        <!-- Current conditions panel (WTHR-04/DATA-06): its own loading/error/content
             branches, independent of the forecast isPending/isError above - a slow/failed
             current-weather fetch never blocks the forecast list/chart from rendering. -->
        <h2 class="text-h6 mb-2">{{ t('detail.currentHeading') }}</h2>
        <v-progress-circular v-if="currentPending" indeterminate color="primary" class="my-4" />
        <v-alert
          v-else-if="currentError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ t('detail.loadError') }}
          <template #append>
            <v-btn size="small" variant="text" @click="refetchCurrent()">
              {{ t('detail.retry') }}
            </v-btn>
          </template>
        </v-alert>
        <v-card
          v-else-if="current && currentCondition"
          class="mb-4"
          data-testid="current-conditions"
        >
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon :icon="currentCondition.icon" size="40" class="mr-3" />
              <div>
                <div class="text-h4">{{ format(current.temperature) }}</div>
                <div class="text-body-2">{{ t(currentCondition.labelKey) }}</div>
              </div>
            </div>
            <div class="d-flex ga-4 text-body-2 flex-wrap mb-2">
              <span>{{ t('card.feelsLike', { value: format(current.feelsLike) }) }}</span>
              <span>
                {{
                  t('card.precipitation', { value: Math.round(current.precipitation * 10) / 10 })
                }}
              </span>
              <span>{{ t('card.uvIndex', { value: Math.round(current.uvIndex) }) }}</span>
            </div>
            <div class="d-flex ga-4 text-body-2 flex-wrap mb-2">
              <span>{{ t('card.sunrise', { value: formatTime(current.sunrise) }) }}</span>
              <span>{{ t('card.sunset', { value: formatTime(current.sunset) }) }}</span>
            </div>
            <div class="d-flex ga-4 text-body-2 align-center mb-2">
              <span>
                <v-icon icon="mdi-weather-windy" size="small" />
                {{ formatWind(current.windSpeed) }}
              </span>
            </div>
            <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
              <span>{{ t('card.lastUpdated', { time: lastUpdatedLabel }) }}</span>
              <v-btn
                :icon="isRefetching ? 'mdi-loading mdi-spin' : 'mdi-refresh'"
                size="x-small"
                variant="text"
                :disabled="isRefetching"
                :aria-label="t('card.refresh')"
                @click="refetchCurrent()"
              />
            </div>
          </v-card-text>
        </v-card>

        <v-row>
          <v-col cols="12" md="5">
            <h2 class="text-h6 mb-2">{{ t('detail.forecastHeading') }}</h2>
            <ForecastList :forecast="forecast" />
          </v-col>
          <v-col cols="12" md="7">
            <h2 class="text-h6 mb-2">{{ t('detail.temperatureHeading') }}</h2>
            <ForecastChart :forecast="forecast" />
            <!-- Hourly mixed chart under the temperature chart. v-if guards the render until
                 the hourly query settles (an errored/empty state just hides it - T-06-05). -->
            <h2 class="text-h6 mb-2 mt-4">{{ t('detail.hourlyHeading') }}</h2>
            <HourlyChart v-if="hourly" :hourly="hourly" />
          </v-col>
        </v-row>
      </template>
    </template>
  </section>
</template>
