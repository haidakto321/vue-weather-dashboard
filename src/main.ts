import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

// pinia = client state (saved cities); VueQueryPlugin = server state (weather fetch
// caching, loading, error). Both registered before mount so stores/queries work app-wide.
const pinia = createPinia()

createApp(App).use(router).use(vuetify).use(pinia).use(VueQueryPlugin).mount('#app')
