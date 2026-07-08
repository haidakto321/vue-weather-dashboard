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
//   - validation: the city-search form validation messages
//   - wmo      : WMO weather-condition labels (keyed by numeric WMO code + `unknown`)
//
// WMO weather-condition labels ARE now translated here (I18N-05): src/lib/wmo.ts maps each
// WMO code to a `wmo.<code>` message KEY, and the render sites (WeatherCard, ForecastList)
// translate it via t(). The keys are numeric-strings ('0', '1', ... '99') plus `unknown` for
// the fallback - vue-i18n accepts numeric-string leaf keys.
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
  wmo: {
    '0': 'Clear sky',
    '1': 'Mainly clear',
    '2': 'Partly cloudy',
    '3': 'Overcast',
    '45': 'Fog',
    '48': 'Depositing rime fog',
    '51': 'Light drizzle',
    '53': 'Moderate drizzle',
    '55': 'Dense drizzle',
    '56': 'Light freezing drizzle',
    '57': 'Dense freezing drizzle',
    '61': 'Slight rain',
    '63': 'Moderate rain',
    '65': 'Heavy rain',
    '66': 'Light freezing rain',
    '67': 'Heavy freezing rain',
    '71': 'Slight snowfall',
    '73': 'Moderate snowfall',
    '75': 'Heavy snowfall',
    '77': 'Snow grains',
    '80': 'Slight rain showers',
    '81': 'Moderate rain showers',
    '82': 'Violent rain showers',
    '85': 'Slight snow showers',
    '86': 'Heavy snow showers',
    '95': 'Thunderstorm',
    '96': 'Thunderstorm with slight hail',
    '99': 'Thunderstorm with heavy hail',
    unknown: 'Unknown',
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
