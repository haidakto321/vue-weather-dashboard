<script setup lang="ts">
import { computed } from 'vue'

import { wmoToCondition } from '@/lib/wmo'
import type { DailyForecast } from '@/types/weather'

const props = defineProps<{ forecast: DailyForecast }>()

// Zip the parallel arrays into one row object per day so the template iterates a single
// list. Index i = day i across all four arrays.
const days = computed(() =>
  props.forecast.dates.map((date, i) => ({
    date,
    high: props.forecast.tempMax[i],
    low: props.forecast.tempMin[i],
    condition: wmoToCondition(props.forecast.weatherCodes[i]),
  })),
)

// Render the ISO date as a short, readable weekday + day-month label.
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
</script>

<template>
  <v-list data-testid="forecast-list" lines="one">
    <v-list-item v-for="day in days" :key="day.date">
      <template #prepend>
        <v-icon :icon="day.condition.icon" class="mr-3" />
      </template>
      <v-list-item-title>{{ formatDate(day.date) }}</v-list-item-title>
      <v-list-item-subtitle>{{ day.condition.label }}</v-list-item-subtitle>
      <template #append>
        <span class="text-no-wrap">
          {{ Math.round(day.high) }}° / {{ Math.round(day.low) }}°
        </span>
      </template>
    </v-list-item>
  </v-list>
</template>
