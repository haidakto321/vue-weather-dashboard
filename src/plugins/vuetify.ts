import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'

// Vuetify instance: mdi icon set + a registered light and dark theme (UI-02). Components
// and directives are auto-imported by vite-plugin-vuetify (see vite.config.ts), so we do
// not register them here.
//
// Vuetify owns theming; the active theme name comes from the preferences store at runtime.
// The theme KEYS below ('light' / 'dark') are exactly the `ThemeMode` values from
// src/types/preferences.ts, so a persisted preference maps 1:1 to a registered theme. We
// keep `defaultTheme: 'light'` only as a static fallback - the real initial theme is
// applied at first paint from the persisted preference by useThemePreference() (so this
// plugin module never needs to read Pinia/localStorage).
export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      // Vuetify's built-in light/dark base palettes. Kept minimal/readable on purpose
      // (study artifact): `dark: false` / `dark: true` selects the base palette and the
      // app's primary color carries over.
      light: {
        dark: false,
      },
      dark: {
        dark: true,
      },
    },
  },
})

export default vuetify
