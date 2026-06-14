<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import CitySearch from '@/components/CitySearch.vue'
import WeatherCard from '@/components/WeatherCard.vue'
import { useCitiesStore } from '@/stores/cities'

// Pinia holds the saved cities; storeToRefs keeps them reactive in the template.
const store = useCitiesStore()
const { cities, hasCities } = storeToRefs(store)

const { t } = useI18n()
</script>

<template>
  <section class="pa-4">
    <h1 class="text-h4 mb-4">{{ t('dashboard.heading') }}</h1>

    <CitySearch class="mb-6" />

    <!-- Empty state (D-09) -->
    <v-sheet
      v-if="!hasCities"
      class="d-flex flex-column align-center pa-8 text-medium-emphasis"
      rounded
    >
      <v-icon icon="mdi-map-search-outline" size="64" class="mb-3" />
      <p>{{ t('dashboard.emptyState') }}</p>
    </v-sheet>

    <!-- One card per saved city -->
    <v-row v-else>
      <v-col v-for="city in cities" :key="city.key" cols="12" sm="6" md="4">
        <WeatherCard :city="city" />
      </v-col>
    </v-row>
  </section>
</template>
