// Open-Meteo returns WMO weather codes (numbers). This util maps each code to a human
// label and an mdi icon name (icons ship with @mdi/font, already installed). Codes are
// grouped per the WMO table; any unmapped code falls back so the UI never renders blank.

interface Condition {
  label: string
  icon: string
}

const WMO_TABLE: Record<number, Condition> = {
  0: { label: 'Clear sky', icon: 'mdi-weather-sunny' },
  1: { label: 'Mainly clear', icon: 'mdi-weather-partly-cloudy' },
  2: { label: 'Partly cloudy', icon: 'mdi-weather-partly-cloudy' },
  3: { label: 'Overcast', icon: 'mdi-weather-cloudy' },
  45: { label: 'Fog', icon: 'mdi-weather-fog' },
  48: { label: 'Depositing rime fog', icon: 'mdi-weather-fog' },
  51: { label: 'Light drizzle', icon: 'mdi-weather-partly-rainy' },
  53: { label: 'Moderate drizzle', icon: 'mdi-weather-partly-rainy' },
  55: { label: 'Dense drizzle', icon: 'mdi-weather-rainy' },
  56: { label: 'Light freezing drizzle', icon: 'mdi-weather-snowy-rainy' },
  57: { label: 'Dense freezing drizzle', icon: 'mdi-weather-snowy-rainy' },
  61: { label: 'Slight rain', icon: 'mdi-weather-rainy' },
  63: { label: 'Moderate rain', icon: 'mdi-weather-rainy' },
  65: { label: 'Heavy rain', icon: 'mdi-weather-pouring' },
  66: { label: 'Light freezing rain', icon: 'mdi-weather-snowy-rainy' },
  67: { label: 'Heavy freezing rain', icon: 'mdi-weather-snowy-rainy' },
  71: { label: 'Slight snowfall', icon: 'mdi-weather-snowy' },
  73: { label: 'Moderate snowfall', icon: 'mdi-weather-snowy' },
  75: { label: 'Heavy snowfall', icon: 'mdi-weather-snowy-heavy' },
  77: { label: 'Snow grains', icon: 'mdi-weather-snowy' },
  80: { label: 'Slight rain showers', icon: 'mdi-weather-partly-rainy' },
  81: { label: 'Moderate rain showers', icon: 'mdi-weather-rainy' },
  82: { label: 'Violent rain showers', icon: 'mdi-weather-pouring' },
  85: { label: 'Slight snow showers', icon: 'mdi-weather-snowy' },
  86: { label: 'Heavy snow showers', icon: 'mdi-weather-snowy-heavy' },
  95: { label: 'Thunderstorm', icon: 'mdi-weather-lightning' },
  96: { label: 'Thunderstorm with slight hail', icon: 'mdi-weather-lightning-rainy' },
  99: { label: 'Thunderstorm with heavy hail', icon: 'mdi-weather-lightning-rainy' },
}

const FALLBACK: Condition = { label: 'Unknown', icon: 'mdi-weather-cloudy-alert' }

// Look up a WMO code; unmapped codes return the non-empty fallback.
export function wmoToCondition(code: number): Condition {
  return WMO_TABLE[code] ?? FALLBACK
}
