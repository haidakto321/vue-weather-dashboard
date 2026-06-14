<script setup lang="ts">
import { computed, watch, ref, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import ForecastList from '@/components/ForecastList.vue'
import ForecastChart from '@/components/ForecastChart.vue'
import { useForecast } from '@/composables/useForecast'
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

// Vue Query owns loading/error/cache for the forecast. We only have a city to query for
// when the param resolved, so the query is driven by a fallback ref that updates when the
// resolved city changes. When there is no city we render the not-found state instead and
// the forecast result is ignored.
const queryCity: Ref<SavedCity> = ref(
  city.value ?? { key: '', id: 0, name: '', latitude: 0, longitude: 0, country: '' },
)
watch(
  city,
  (c) => {
    if (c) queryCity.value = c
  },
  { immediate: true },
)

// useForecast is keyed by city.key, so when queryCity changes to a different saved city
// the query refetches and both the list and chart re-render (CHRT-02).
const { data, isPending, isError } = useForecast(
  // Pass a reactive proxy: the composable reads city.key at call time, and Vue Query's
  // reactive query key follows queryCity. Use a getter-backed object so key stays live.
  new Proxy({} as SavedCity, {
    get: (_t, prop: keyof SavedCity) => queryCity.value[prop],
  }),
)

const forecast = computed<DailyForecast | undefined>(() => data.value)
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
          </v-col>
        </v-row>
      </template>
    </template>
  </section>
</template>
