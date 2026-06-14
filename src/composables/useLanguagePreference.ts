import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { usePreferencesStore } from '@/stores/preferences'

// useLanguagePreference is the ONE place the persisted language preference and vue-i18n's
// active locale are kept in sync. Data flow:
//
//   preferences store (persisted via VueUse) -> vue-i18n active locale
//
// - The store owns the chosen value (`language`, a validated 'en'/'ja' - the store sanitizes
//   it on read-back so only a registered locale ever reaches here - threat T-04-07).
// - vue-i18n owns translation and renders the active locale's strings across the whole UI.
//
// Mount this once at the app root (App.vue), next to useThemePreference(), so the binding is
// active for every route. The locale is applied immediately on setup (no flash of the wrong
// language on reload) and then a watcher mirrors any later setLanguage(...) into vue-i18n so a
// Settings language switch updates the entire app live, with no reload.
export function useLanguagePreference() {
  const store = usePreferencesStore()
  const { language } = storeToRefs(store)
  const { locale } = useI18n()

  // Apply the persisted language right away so the correct locale is active at first paint.
  locale.value = language.value

  // Keep vue-i18n's active locale following the store; immediate covers the hydration-order
  // edge cases the same way useThemePreference does for the theme.
  watch(
    language,
    (next) => {
      locale.value = next
    },
    { immediate: true },
  )
}
