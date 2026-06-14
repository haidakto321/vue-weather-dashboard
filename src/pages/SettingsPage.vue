<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { usePreferencesStore } from '@/stores/preferences'
import type { TemperatureUnit } from '@/types/preferences'

// Pinia preferences store = the single source of preference state. Binding the unit and
// theme controls to it drives the live UI update and the persistence from 04-01/04-02.
const store = usePreferencesStore()
const { unit, theme } = storeToRefs(store)

// Human labels for the segmented unit control, sourced from the same value set the store
// validates against.
const unitOptions: { value: TemperatureUnit; label: string }[] = [
  { value: 'celsius', label: 'Celsius (°C)' },
  { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
]

// A change immediately calls setUnit, which writes into the persisted store ref.
function onUnitChange(value: unknown) {
  if (value === 'celsius' || value === 'fahrenheit') {
    store.setUnit(value)
  }
}

// Theme: a "Dark mode" switch maps the boolean to the store's 'dark'/'light' value. Calling
// setTheme flips the whole UI live (via useThemePreference's binding) and persists the choice.
const darkMode = computed({
  get: () => theme.value === 'dark',
  set: (on: boolean) => store.setTheme(on ? 'dark' : 'light'),
})
</script>

<template>
  <section class="pa-4">
    <h1 class="text-h4 mb-4">Settings</h1>

    <!-- Temperature unit: the only control wired in this plan (04-01). -->
    <v-card class="mb-4">
      <v-card-title>Temperature unit</v-card-title>
      <v-card-text>
        <v-btn-toggle
          :model-value="unit"
          color="primary"
          mandatory
          density="comfortable"
          @update:model-value="onUnitChange"
        >
          <v-btn v-for="opt in unitOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </v-btn>
        </v-btn-toggle>
      </v-card-text>
    </v-card>

    <!-- Theme: live light/dark toggle wired in this plan (04-02). The switch binds to the
         store; flipping it calls setTheme, which switches the whole UI live and persists. -->
    <v-card class="mb-4">
      <v-card-title>Theme</v-card-title>
      <v-card-text>
        <v-switch
          v-model="darkMode"
          color="primary"
          density="comfortable"
          hide-details
          label="Dark mode"
        />
      </v-card-text>
    </v-card>

    <!-- Language section: placeholder. 04-03 drops the en/ja switcher in here. -->
    <v-card>
      <v-card-title>Language</v-card-title>
      <v-card-text class="text-medium-emphasis">
        Language switching (English / Japanese) arrives in a later step.
      </v-card-text>
    </v-card>
  </section>
</template>
