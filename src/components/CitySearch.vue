<script setup lang="ts">
import { ref } from 'vue'
import { useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import * as yup from 'yup'

import { geocodeCity } from '@/lib/openMeteo'
import { useCitiesStore } from '@/stores/cities'
import type { GeoCity } from '@/types/weather'

const store = useCitiesStore()

// t() localizes the search box label/placeholder. The vee-validate error messages stay as
// authored strings for now (validation copy is out of this slice's scope - noted in
// implementation-notes).
const { t } = useI18n()

// vee-validate + yup = validation: only geocode a non-empty, sensible-length term.
const schema = yup
  .string()
  .required('Enter a city name')
  .min(2, 'Type at least 2 characters')
  .max(80, 'City name is too long')

// validateOnValueUpdate: false -> vee-validate does NOT auto-validate when `term` changes.
// We validate explicitly in the debounce (non-empty input only). This stops the "required"
// rule from re-firing on the empty value set after a city is picked (the stale-error bug).
const { value: term, errorMessage, validate, resetField } = useField<string>('city', schema, {
  validateOnValueUpdate: false,
})

const items = ref<GeoCity[]>([])
const loading = ref(false)
const selected = ref<GeoCity | null>(null)

let debounceId: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
// Selecting an item makes Vuetify push the title back into the search box; skip the
// geocode that this echo would otherwise trigger.
let suppressSearch = false

// geocodeCity = HTTP search. Debounced (~300ms, hand-rolled - no lodash) + validated;
// aborts the previous in-flight request so only the latest term resolves.
function onSearch(text: string) {
  if (suppressSearch) {
    suppressSearch = false
    return
  }
  term.value = text
  if (debounceId) clearTimeout(debounceId)
  // Empty box (manual clear, or the echo after selecting a city): just reset.
  // Do not run the "required" validation - an empty field is the resting state,
  // not an error to flag. resetField also clears any leftover error message.
  if (!text || !text.trim()) {
    items.value = []
    resetField()
    return
  }
  debounceId = setTimeout(async () => {
    const result = await validate()
    if (!result.valid) {
      items.value = []
      return
    }
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    try {
      items.value = await geocodeCity(text, controller.signal)
    } catch {
      // Aborted or transient failure: show no matches. Per-card weather errors are
      // handled in WeatherCard, not here.
      items.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

// store.addCity = saved cities. The store dedupes, so re-picking a city is a no-op.
// Clear the field afterwards so it is ready for the next search.
function onSelect(city: GeoCity | null) {
  if (!city) return
  store.addCity(city)
  suppressSearch = true
  selected.value = null
  items.value = []
  // resetField clears the value AND any validation error/touched state, so the box
  // is clean for the next search (no lingering "Enter a city name").
  resetField()
}

// Show name + region + country so ambiguous names (Paris, Springfield) are distinct.
function cityTitle(city: GeoCity): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(', ')
}
</script>

<template>
  <v-autocomplete
    v-model="selected"
    :items="items"
    :item-title="cityTitle"
    item-value="id"
    return-object
    no-filter
    clearable
    :loading="loading"
    :error-messages="errorMessage ? [errorMessage] : []"
    :label="t('search.label')"
    :placeholder="t('search.placeholder')"
    prepend-inner-icon="mdi-magnify"
    @update:search="onSearch"
    @update:model-value="onSelect"
  />
</template>
