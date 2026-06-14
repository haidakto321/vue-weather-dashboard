import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { i18n } from './i18n'

// pinia = client state (saved cities); VueQueryPlugin = server state (weather fetch
// caching, loading, error). Both registered before mount so stores/queries work app-wide.
// vue-i18n = UI translation; active locale follows the preferences store (see
// useLanguagePreference). Pinia stays before any store read.
const pinia = createPinia()

createApp(App)
  .use(router)
  .use(vuetify)
  .use(pinia)
  .use(VueQueryPlugin)
  .use(i18n)
  .mount('#app')
