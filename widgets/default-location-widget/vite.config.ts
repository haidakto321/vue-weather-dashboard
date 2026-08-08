import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Fixed port 5174 so the main app's DefaultLocationWidget.vue fallback URL
// (http://localhost:5174) works with zero .env setup.
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
  },
})
