<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Chart } from 'vue-chartjs'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

import { useTemperature } from '@/composables/useTemperature'
import type { HourlyForecast } from '@/types/weather'

// vue-chartjs = the mixed hourly chart. A mixed line+bar chart needs BOTH controllers
// registered, not just the elements (Pitfall 4): without BarController the bar dataset
// silently renders nothing. Register everything the chart needs exactly once at module load
// (tree-shaken Chart.js requires explicit registration).
ChartJS.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
)

const props = defineProps<{ hourly: HourlyForecast }>()

// Convert stored °C to the active unit for the temperature line only. Precipitation is mm and
// is NOT converted - the unit toggle never touches it (Pitfall 8).
const { convert, unitSymbol } = useTemperature()

// Read the SAME live theme + locale sources the rest of the app uses, so a theme flip or a
// language switch restyles/relabels the chart with no reload (same discipline as ForecastChart).
const theme = useTheme()
const { t, locale } = useI18n()

// Map the app locale ('en'/'ja') to a BCP-47 tag for toLocaleTimeString.
const timeLocale = computed(() => (locale.value === 'ja' ? 'ja-JP' : 'en-GB'))

// chartData is computed over the prop AND the reactive unit + locale, so a different city's
// hourly data, a unit change, or a language switch produces a new object and Vue re-renders
// the chart. Reading t()/locale/unitSymbol INSIDE the computed is what makes the labels
// re-render on those changes (Pitfall 3).
const chartData = computed(() => ({
  labels: props.hourly.times.map((iso) =>
    new Date(iso).toLocaleTimeString(timeLocale.value, { hour: '2-digit' }),
  ),
  datasets: [
    {
      // Temperature line on the left y-axis, mapped through convert (unit-aware).
      type: 'line' as const,
      label: t('chart.temperature', { unit: unitSymbol.value }),
      data: props.hourly.temperature.map((temp) => convert(temp)),
      borderColor: '#e53935',
      backgroundColor: '#e53935',
      yAxisID: 'y',
      tension: 0.3,
    },
    {
      // Precipitation bars on the right y-axis. NOT unit-converted - mm only (Pitfall 8).
      type: 'bar' as const,
      label: t('chart.precipitation'),
      data: props.hourly.precipitation,
      backgroundColor: '#1e88e5',
      yAxisID: 'y1',
    },
  ],
}))

// chartOptions is a COMPUTED so the chrome (tick text, grid, legend) restyles live on a theme
// flip (same fix as ForecastChart - a plain object never re-evaluates). Reading
// theme.current.value.dark inside registers the dependency. Two y-axes: temperature on the
// left (y), precipitation on the right (y1) with drawOnChartArea:false so the two grids do not
// overlap (Pitfall 8).
const chartOptions = computed(() => {
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
      // Left axis: temperature (unit-aware line).
      y: { position: 'left' as const, ticks: { color: textColor }, grid: { color: gridColor } },
      // Right axis: precipitation (mm bars). drawOnChartArea:false keeps its grid off the plot.
      y1: {
        position: 'right' as const,
        ticks: { color: textColor },
        grid: { drawOnChartArea: false },
      },
    },
  }
})
</script>

<template>
  <!-- Sized container because maintainAspectRatio is false. -->
  <div data-testid="hourly-chart" style="height: 320px">
    <!-- :key remounts the chart on a theme or language change. vue-chartjs's shallow options
         watch can miss nested scale/legend color swaps, so a clean remount guarantees the
         restyle/relabel actually paints (same discipline as ForecastChart). type="bar" is the
         base type; per-dataset `type` overrides make it a mixed line+bar chart. -->
    <Chart
      type="bar"
      :key="theme.name.value + '-' + locale"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>
