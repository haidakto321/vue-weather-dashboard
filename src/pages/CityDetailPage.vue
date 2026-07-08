<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import ForecastList from '@/components/ForecastList.vue'
import ForecastChart from '@/components/ForecastChart.vue'
import HourlyChart from '@/components/HourlyChart.vue'
import { useForecast } from '@/composables/useForecast'
import { useHourlyForecast } from '@/composables/useHourlyForecast'
import { useCitiesStore } from '@/stores/cities'
import type { DailyForecast, SavedCity } from '@/types/weather'

// Vue Router params decide which city is shown. The :id is user-controllable (deep link),
// so it is only ever used to LOOK UP an existing saved city - never to build a request.
const route = useRoute()
const store = useCitiesStore()

const { t } = useI18n()

// Resolve the route param to a SavedCity reactively: a computed on params.id so changing
// :id (navigating to another city) re-resolves and re-keys the forecast query (CHRT-02).
const city = computed<SavedCity | undefined>(() => {
  const id = String(route.params.id)
  return store.cities.find((c) => String(c.id) === id || c.key === id)
})

const subtitle = computed(() =>
  city.value ? [city.value.admin1, city.value.country].filter(Boolean).join(', ') : '',
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
      <h1 class="text-h4 mb-1">{{ city.name }}</h1>
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
