<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { usePreferencesStore } from '@/stores/preferences'
import type { TemperatureUnit, WindUnit, Language } from '@/types/preferences'

// Pinia preferences store = the single source of preference state. Binding the unit, theme,
// and language controls to it drives the live UI update and the persistence from 04-01/02/03.
const store = usePreferencesStore()
const { unit, windUnit, theme, language } = storeToRefs(store)

// t() = the active-locale translator. SettingsPage's own labels are translated too, so the
// whole page switches language live alongside the rest of the app.
const { t } = useI18n()

// Human labels for the segmented unit control come from i18n so they localize. Values are
// the store's validated TemperatureUnit set (single source of truth).
const unitOptions = computed<{ value: TemperatureUnit; label: string }[]>(() => [
  { value: 'celsius', label: t('settings.celsius') },
  { value: 'fahrenheit', label: t('settings.fahrenheit') },
])

// A change immediately calls setUnit, which writes into the persisted store ref.
function onUnitChange(value: unknown) {
  if (value === 'celsius' || value === 'fahrenheit') {
    store.setUnit(value)
  }
}

// Wind speed unit (WTHR-05): mirrors unitOptions/onUnitChange exactly. The composable/store
// field was built in Plan 07-03; WeatherCard/CityDetailPage already consume it (07-05) - this
// is the last piece, the UI control the user actually interacts with.
const windUnitOptions = computed<{ value: WindUnit; label: string }[]>(() => [
  { value: 'kmh', label: t('settings.kmh') },
  { value: 'mph', label: t('settings.mph') },
])

function onWindUnitChange(value: unknown) {
  if (value === 'kmh' || value === 'mph') {
    store.setWindUnit(value)
  }
}

// Theme: a "Dark mode" switch maps the boolean to the store's 'dark'/'light' value. Calling
// setTheme flips the whole UI live (via useThemePreference's binding) and persists the choice.
const darkMode = computed({
  get: () => theme.value === 'dark',
  set: (on: boolean) => store.setTheme(on ? 'dark' : 'light'),
})

// Language: the en/ja switcher (04-03). Labels are the language's OWN name (English / 日本語)
// so they read the same regardless of the current locale. Changing it calls setLanguage,
// which via useLanguagePreference switches every string in the app live and persists.
const languageOptions: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
]

function onLanguageChange(value: unknown) {
  if (value === 'en' || value === 'ja') {
    store.setLanguage(value)
  }
}
</script>

<template>
  <section class="pa-4">
    <h1 class="text-h4 mb-4">{{ t('settings.heading') }}</h1>

    <!-- Temperature unit: the unit slice (04-01). -->
    <v-card class="mb-4">
      <v-card-title>{{ t('settings.unitSection') }}</v-card-title>
      <v-card-text>
        <v-btn-toggle
          data-testid="unit-toggle"
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

    <!-- Wind speed unit: the last piece of WTHR-05 (composable/store in 07-03, consumed by
         WeatherCard/CityDetailPage in 07-05). Mirrors the temperature-unit control exactly. -->
    <v-card class="mb-4">
      <v-card-title>{{ t('settings.windUnitSection') }}</v-card-title>
      <v-card-text>
        <v-btn-toggle
          data-testid="wind-unit-toggle"
          :model-value="windUnit"
          color="primary"
          mandatory
          density="comfortable"
          @update:model-value="onWindUnitChange"
        >
          <v-btn v-for="opt in windUnitOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </v-btn>
        </v-btn-toggle>
      </v-card-text>
    </v-card>

    <!-- Theme: live light/dark toggle (04-02). The switch binds to the store; flipping it
         calls setTheme, which switches the whole UI live and persists. -->
    <v-card class="mb-4">
      <v-card-title>{{ t('settings.themeSection') }}</v-card-title>
      <v-card-text>
        <v-switch
          v-model="darkMode"
          data-testid="theme-switch"
          color="primary"
          density="comfortable"
          hide-details
          :label="t('settings.darkModeLabel')"
        />
      </v-card-text>
    </v-card>

    <!-- Language: the en/ja switcher (04-03). Bound to the store; changing it switches all
         UI text live (via useLanguagePreference) and persists. -->
    <v-card>
      <v-card-title>{{ t('settings.languageSection') }}</v-card-title>
      <v-card-text>
        <v-btn-toggle
          data-testid="language-toggle"
          :model-value="language"
          color="primary"
          mandatory
          density="comfortable"
          @update:model-value="onLanguageChange"
        >
          <v-btn v-for="opt in languageOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </v-btn>
        </v-btn-toggle>
      </v-card-text>
    </v-card>
  </section>
</template>
