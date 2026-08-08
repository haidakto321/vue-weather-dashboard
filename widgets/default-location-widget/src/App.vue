<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface SavedCityLite {
  key: string
  name: string
  latitude: number
  longitude: number
  admin1?: string
  country?: string
}

interface InitMessage {
  type: 'widget:init'
  cities: SavedCityLite[]
  defaultCityKey: string | null
}

// Falls back to the main app's fixed dev port so this works with zero .env setup;
// VITE_PARENT_ORIGIN overrides it if the main app is ever served elsewhere.
const PARENT_ORIGIN =
  (import.meta.env.VITE_PARENT_ORIGIN as string | undefined) ?? 'http://localhost:5173'

const hasInitialized = ref(false)
const cities = ref<SavedCityLite[]>([])
const selectedKey = ref<string | null>(null)
const defaultCityKey = ref<string | null>(null)
const isRainyTomorrow = ref(false)
const rainyCityName = ref('')
const checkingRain = ref(false)

function isTrustedOrigin(origin: string): boolean {
  return origin === PARENT_ORIGIN
}

async function checkRain(cityKey: string) {
  const city = cities.value.find((c) => c.key === cityKey)
  if (!city) return

  checkingRain.value = true
  isRainyTomorrow.value = false
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(city.latitude))
    url.searchParams.set('longitude', String(city.longitude))
    url.searchParams.set('daily', 'precipitation_probability_max,weathercode')
    url.searchParams.set('forecast_days', '2')
    url.searchParams.set('timezone', 'auto')

    const response = await fetch(url.toString())
    const data = await response.json()
    const tomorrowProbability: number = data?.daily?.precipitation_probability_max?.[1] ?? 0

    isRainyTomorrow.value = tomorrowProbability >= 50
    rainyCityName.value = city.name
  } finally {
    checkingRain.value = false
  }
}

function onSelectChange() {
  if (selectedKey.value) checkRain(selectedKey.value)
}

function setAsDefault() {
  if (!selectedKey.value) return
  window.parent.postMessage(
    { type: 'widget:set-default', cityKey: selectedKey.value },
    PARENT_ORIGIN,
  )
  defaultCityKey.value = selectedKey.value
}

function handleMessage(event: MessageEvent) {
  if (!isTrustedOrigin(event.origin)) return

  const data = event.data as { type?: unknown } | null
  if (!data || data.type !== 'widget:init') return

  const init = event.data as InitMessage
  hasInitialized.value = true
  cities.value = init.cities
  defaultCityKey.value = init.defaultCityKey
  selectedKey.value = init.defaultCityKey ?? init.cities[0]?.key ?? null
  if (selectedKey.value) checkRain(selectedKey.value)
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
  window.parent.postMessage({ type: 'widget:ready' }, PARENT_ORIGIN)
})
</script>

<template>
  <main class="widget">
    <h1>Default location</h1>

    <p v-if="!hasInitialized" class="status">Waiting for the dashboard...</p>
    <p v-else-if="cities.length === 0" class="status">
      No saved cities yet - add one on the dashboard.
    </p>

    <template v-else>
      <select v-model="selectedKey" @change="onSelectChange">
        <option v-for="city in cities" :key="city.key" :value="city.key">
          {{ city.name }}
        </option>
      </select>

      <p v-if="checkingRain" class="status">Checking tomorrow's forecast...</p>
      <p v-else-if="isRainyTomorrow" class="banner">
        Rain expected tomorrow in {{ rainyCityName }}
      </p>

      <div>
        <button :disabled="selectedKey === defaultCityKey" @click="setAsDefault">
          Set as default
        </button>
        <p v-if="selectedKey === defaultCityKey" class="status">This is the default location.</p>
      </div>
    </template>
  </main>
</template>

<style>
.widget {
  font-family: system-ui, sans-serif;
  padding: 12px;
  border: 2px dashed #999;
  border-radius: 4px;
  box-sizing: border-box;
}
.banner {
  background: #fde68a;
  padding: 8px;
  border-radius: 4px;
}
.status {
  color: #555;
  font-size: 0.9em;
}
</style>
