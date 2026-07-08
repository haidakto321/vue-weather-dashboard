// English message catalogue for vue-i18n.
//
// This file and ja.ts MUST share the EXACT same key shape - every key here has to exist in
// ja.ts too, so a language switch never hits a missing key (no fallback gaps). Keys are
// grouped by UI area for readability:
//   - nav      : navigation drawer item titles
//   - app      : app-bar / global chrome
//   - dashboard: the dashboard page
//   - search   : the city-search control labels
//   - card     : the weather card (errors + aria labels + unit words)
//   - detail   : the city-detail page
//   - settings : the settings page controls
//
// WMO weather-condition labels are intentionally NOT translated here - they stay English-only
// in src/lib/wmo.ts. For a study artifact, translating the app chrome/pages is the clear,
// readable scope; the condition vocabulary (e.g. "Partly cloudy") is left as one English
// source. This decision is recorded in implementation-notes.md.
export default {
  nav: {
    dashboard: 'Dashboard',
    cityDetail: 'City Detail',
    settings: 'Settings',
  },
  app: {
    title: 'Vue Weather Dashboard',
    toggleNavigation: 'Toggle navigation',
    toggleDarkMode: 'Toggle dark mode',
  },
  dashboard: {
    heading: 'Dashboard',
    emptyState: 'Search for a city to see its current weather.',
  },
  search: {
    label: 'Search for a city',
    placeholder: 'Start typing a city name',
  },
  validation: {
    cityRequired: 'Enter a city name',
    cityMin: 'Type at least 2 characters',
    cityMax: 'City name is too long',
  },
  card: {
    viewForecast: 'View forecast for {city}',
    remove: 'Remove {city}',
    loadError: 'Could not load weather - check your connection.',
    retry: 'Retry',
    wind: '{value} km/h',
    humidity: '{value}%',
  },
  chart: {
    tempHigh: 'High {unit}',
    tempLow: 'Low {unit}',
    temperature: 'Temperature {unit}',
    precipitation: 'Precipitation',
  },
  detail: {
    forecastHeading: '7-day forecast',
    temperatureHeading: 'Temperature',
    hourlyHeading: 'Hourly forecast',
    notFoundTitle: 'City not found',
    notFoundBody: 'We do not have that city saved - return to the dashboard and search for it.',
    backToDashboard: 'Back to dashboard',
    loadError: 'Could not load the forecast - check your connection.',
    retry: 'Retry',
  },
  notFound: {
    title: 'Page not found',
    body: 'That URL does not match anything here - return to the dashboard.',
    backToDashboard: 'Back to dashboard',
  },
  settings: {
    heading: 'Settings',
    unitSection: 'Temperature unit',
    themeSection: 'Theme',
    languageSection: 'Language',
    celsius: 'Celsius (°C)',
    fahrenheit: 'Fahrenheit (°F)',
    darkModeLabel: 'Dark mode',
    english: 'English',
    japanese: '日本語',
  },
}
