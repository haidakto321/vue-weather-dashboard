<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'

import CitySearch from '@/components/CitySearch.vue'
import GeolocationButton from '@/components/GeolocationButton.vue'
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

    <GeolocationButton class="mb-4" />

    <!-- Empty state (D-09) -->
    <v-sheet
      v-if="!hasCities"
      class="d-flex flex-column align-center pa-8 text-medium-emphasis"
      rounded
    >
      <v-icon icon="mdi-map-search-outline" size="64" class="mb-3" />
      <p>{{ t('dashboard.emptyState') }}</p>
    </v-sheet>

    <!-- Draggable card grid (STATE-04): tag="div" + a v-col inside the #item slot, never a
         Vuetify component object passed as the tag prop (RESEARCH Pattern 2/Pitfall 4). The
         reorder handler calls the store action directly (not a storeToRefs ref). -->
    <draggable
      v-else
      :model-value="cities"
      item-key="key"
      tag="div"
      class="d-flex flex-wrap ga-4"
      @update:model-value="store.reorderCities"
    >
      <template #item="{ element }">
        <v-col cols="12" sm="6" md="4" class="pa-0" style="min-width: 280px">
          <WeatherCard :city="element" />
        </v-col>
      </template>
    </draggable>
  </section>
</template>
