<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useTemperature } from '@/composables/useTemperature'
import { wmoToCondition } from '@/lib/wmo'
import type { DailyForecast } from '@/types/weather'

const props = defineProps<{ forecast: DailyForecast }>()

// High/low render through the active unit; switching units updates them live.
const { format } = useTemperature()

// Active i18n locale drives the date formatting too, so dates localize with the language.
// t() translates the WMO condition label key (I18N-05) at the render site.
const { locale, t } = useI18n()

// Map the app locale ('en'/'ja') to a BCP-47 tag for toLocaleDateString. Kept simple: 'en'
// uses 'en-GB' (day-month order, matching the prior behavior) and 'ja' uses 'ja-JP'.
const dateLocale = computed(() => (locale.value === 'ja' ? 'ja-JP' : 'en-GB'))

// Render the ISO date as a short, readable weekday + day-month label in the active locale.
function formatDate(iso: string): string {
  // Parse the 'YYYY-MM-DD' date-only string as LOCAL time. `new Date(iso)` treats a
  // bare date as UTC midnight, so at negative UTC offsets the label rolls back one day.
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(dateLocale.value, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// Zip the parallel arrays into one row object per day so the template iterates a single
// list. Index i = day i across all four arrays. The computed reads dateLocale (via
// formatDate) so the labels re-render when the language switches.
const days = computed(() =>
  props.forecast.dates.map((date, i) => ({
    date,
    label: formatDate(date),
    high: props.forecast.tempMax[i],
    low: props.forecast.tempMin[i],
    condition: wmoToCondition(props.forecast.weatherCodes[i]),
  })),
)
</script>

<template>
  <v-list data-testid="forecast-list" lines="one">
    <v-list-item v-for="day in days" :key="day.date">
      <template #prepend>
        <v-icon :icon="day.condition.icon" class="mr-3" />
      </template>
      <v-list-item-title>{{ day.label }}</v-list-item-title>
      <v-list-item-subtitle>{{ t(day.condition.labelKey) }}</v-list-item-subtitle>
      <template #append>
        <span class="text-no-wrap"> {{ format(day.high) }} / {{ format(day.low) }} </span>
      </template>
    </v-list-item>
  </v-list>
</template>
