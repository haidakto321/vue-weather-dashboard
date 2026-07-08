<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

import { useTemperature } from '@/composables/useTemperature'
import type { DailyForecast } from '@/types/weather'

// vue-chartjs = the temperature chart; Vue reactivity re-renders it when the data prop
// changes (CHRT-02). Register the Chart.js pieces a line chart needs exactly once at
// module load (tree-shaken Chart.js requires explicit registration).
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const props = defineProps<{ forecast: DailyForecast }>()

// Convert stored °C values to the active unit for display. chartData also depends on the
// reactive unit, so switching units re-renders the chart with converted values + updated
// labels live (CHRT-02).
const { convert, unitSymbol } = useTemperature()

// The chart must read the SAME live theme + locale sources the rest of the app uses, so a
// theme flip or a language switch restyles/relabels it with no reload (CHRT-03/CHRT-04).
// theme.current.value is Vuetify's active theme; locale is vue-i18n's active language.
const theme = useTheme()
const { t, locale } = useI18n()

// Map the app locale ('en'/'ja') to a BCP-47 tag for toLocaleDateString - copied verbatim
// from ForecastList.vue so the chart x-axis dates localize exactly like the forecast list.
const dateLocale = computed(() => (locale.value === 'ja' ? 'ja-JP' : 'en-GB'))

// chartData is computed over the prop AND the reactive unit, so a different city's forecast
// or a unit change produces a new object and Vue re-renders <Line> - no manual
// chart.update() needed (CHRT-02).
const chartData = computed(() => ({
  // Reading t() and dateLocale (locale.value) INSIDE the computed is what makes the labels and
  // axis dates re-render on a language switch (Pitfall 3 - reading them outside would freeze
  // the strings at first render).
  labels: props.forecast.dates.map((iso) =>
    new Date(iso).toLocaleDateString(dateLocale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }),
  ),
  datasets: [
    {
      label: t('chart.tempHigh', { unit: unitSymbol.value }),
      data: props.forecast.tempMax.map((temp) => convert(temp)),
      borderColor: '#e53935',
      backgroundColor: '#e53935',
      tension: 0.3,
    },
    {
      label: t('chart.tempLow', { unit: unitSymbol.value }),
      data: props.forecast.tempMin.map((temp) => convert(temp)),
      borderColor: '#1e88e5',
      backgroundColor: '#1e88e5',
      tension: 0.3,
    },
  ],
}))

// chartOptions is now a COMPUTED (was a plain object - the CHRT-03 bug: a plain object never
// re-evaluates, so the chart chrome never restyled on a theme flip). Reading
// theme.current.value.dark inside the computed registers the dependency, so the options
// recompute whenever the active theme changes. Only the chrome (tick text, grid lines,
// legend text) is theme-driven; the dataset hues stay fixed brand colors (see chartData).
const chartOptions = computed(() => {
  // Always read `.value` so the computed tracks the theme (Pitfall 2 - a bare `theme.current`
  // read would not register a reactive dependency).
  const dark = theme.current.value.dark
  const textColor = dark ? '#e0e0e0' : '#333333'
  const gridColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  return {
    responsive: true,
    // maintainAspectRatio false so the chart fills the sized container below.
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor } },
    },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
      y: { ticks: { color: textColor }, grid: { color: gridColor } },
    },
  }
})
</script>

<template>
  <!-- Sized container because maintainAspectRatio is false. -->
  <div data-testid="forecast-chart" style="height: 320px">
    <!-- :key remounts the chart on a theme or language change. vue-chartjs's shallow options
         watch can miss nested scale/legend color swaps, so a clean remount on theme-name (or
         locale) change guarantees the restyle/relabel actually paints (Pitfall 1). -->
    <Line :key="theme.name.value + '-' + locale" :data="chartData" :options="chartOptions" />
  </div>
</template>
