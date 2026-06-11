import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // autoImport registers Vuetify components/directives on demand (tree-shaken).
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      // Vite resolves a leading "/" relative to the project root.
      '@': '/src',
    },
  },
})
