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

// chartData is computed over the prop AND the reactive unit, so a different city's forecast
// or a unit change produces a new object and Vue re-renders <Line> - no manual
// chart.update() needed (CHRT-02).
const chartData = computed(() => ({
  labels: props.forecast.dates,
  datasets: [
    {
      label: `High ${unitSymbol.value}`,
      data: props.forecast.tempMax.map((t) => convert(t)),
      borderColor: '#e53935',
      backgroundColor: '#e53935',
      tension: 0.3,
    },
    {
      label: `Low ${unitSymbol.value}`,
      data: props.forecast.tempMin.map((t) => convert(t)),
      borderColor: '#1e88e5',
      backgroundColor: '#1e88e5',
      tension: 0.3,
    },
  ],
}))

// maintainAspectRatio false so the chart fills the sized container below.
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
}
</script>

<template>
  <!-- Sized container because maintainAspectRatio is false. -->
  <div data-testid="forecast-chart" style="height: 320px">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
