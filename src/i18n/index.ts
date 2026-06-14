import { createI18n } from 'vue-i18n'

import en from './messages/en'
import ja from './messages/ja'
import { DEFAULT_PREFERENCES, LANGUAGES } from '@/types/preferences'
import type { Language } from '@/types/preferences'

// vue-i18n = the app's UI translation layer. It is created once here and registered in
// main.ts; the ACTIVE locale then follows the persisted `language` preference via the
// useLanguagePreference composable (preferences store -> i18n locale).
//
// legacy: false puts vue-i18n in Composition API mode, which is what lets `<script setup>`
// components call `useI18n()` and read `t(...)`.

// Read the persisted language straight from localStorage for the INITIAL locale.
//
// Why not the Pinia store here? The store needs Pinia active, but this module is imported
// while building the app (before plugins are installed), so reading the store now would be a
// bootstrapping problem. Reading the raw 'weather-prefs' value instead lets i18n start on the
// correct locale at first paint (no flash of the wrong language on reload). The value is
// user/tamper-controllable, so it is validated against LANGUAGES and falls back to the
// default - mirroring the store's own read-back sanitization (threat T-04-07).
function initialLocale(): Language {
  try {
    const raw = localStorage.getItem('weather-prefs')
    if (raw) {
      const parsed = JSON.parse(raw) as { language?: unknown }
      if ((LANGUAGES as readonly string[]).includes(parsed.language as string)) {
        return parsed.language as Language
      }
    }
  } catch {
    // Corrupt/unavailable storage: fall through to the default below.
  }
  return DEFAULT_PREFERENCES.language
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  // A missing key in the active locale degrades to the English string rather than crashing
  // the view (threat T-04-09). en/ja are kept in key parity so this is only a safety net.
  fallbackLocale: 'en',
  messages: { en, ja },
})
