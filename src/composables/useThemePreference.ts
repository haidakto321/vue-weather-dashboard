import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTheme } from 'vuetify'

import { usePreferencesStore } from '@/stores/preferences'
import type { ThemeMode } from '@/types/preferences'

// useThemePreference is the ONE place the persisted theme preference and Vuetify's active
// theme are kept in sync. Data flow:
//
//   preferences store (persisted via VueUse) -> Vuetify active theme
//
// - The store owns the chosen value (`theme`, a validated 'light'/'dark' - threat T-04-05,
//   the store sanitizes it on read-back so only a registered theme name ever reaches here).
// - Vuetify owns theming and applies the named theme to the whole UI (`theme.change`).
//
// Mount this once at the app root (App.vue) so the binding is active for every route. The
// theme is applied immediately on setup (no flash of the wrong theme on reload) and then a
// watcher mirrors any later `setTheme(...)` into Vuetify so a Settings/app-bar toggle
// switches the entire app live.
export function useThemePreference() {
  const store = usePreferencesStore()
  const { theme } = storeToRefs(store)
  const vuetifyTheme = useTheme()

  // Apply the persisted theme right away so the correct theme is active at first paint.
  vuetifyTheme.change(theme.value)

  // Keep Vuetify's active theme following the store; immediate covers SSR/edge cases where
  // the synchronous call above and the store hydration order could differ.
  watch(
    theme,
    (next) => {
      vuetifyTheme.change(next)
    },
    { immediate: true },
  )

  // Convenience: flip light <-> dark via the store (so persistence + the binding above both
  // run). Handy for an app-bar quick-toggle that does not want to import the store itself.
  function toggleTheme() {
    const next: ThemeMode = store.theme === 'dark' ? 'light' : 'dark'
    store.setTheme(next)
  }

  return { toggleTheme }
}
