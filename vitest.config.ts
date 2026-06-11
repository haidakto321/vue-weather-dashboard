import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// Vitest config kept separate from vite.config.ts so the test environment (jsdom,
// globals) is explicit and easy to read for a beginner.
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      // Vite resolves a leading "/" relative to the project root.
      '@': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Vuetify ships ESM + CSS; inline it so its imports resolve in the test transform.
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
  },
})
