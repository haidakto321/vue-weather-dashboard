import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'

// Vuetify instance: mdi icon set + a default light theme. Components and directives are
// auto-imported by vite-plugin-vuetify (see vite.config.ts), so we do not register them
// here.
export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'light',
  },
})

export default vuetify
