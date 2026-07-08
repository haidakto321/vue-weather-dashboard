// Open-Meteo returns WMO weather codes (numbers). This util maps each code to a label KEY
// (an i18n message key, translated at the render site via t()) and an mdi icon name (icons
// ship with @mdi/font, already installed). Codes are grouped per the WMO table; any unmapped
// code falls back so the UI never renders blank.

interface Condition {
  labelKey: string
  icon: string
}

const WMO_TABLE: Record<number, Condition> = {
  0: { labelKey: 'wmo.0', icon: 'mdi-weather-sunny' },
  1: { labelKey: 'wmo.1', icon: 'mdi-weather-partly-cloudy' },
  2: { labelKey: 'wmo.2', icon: 'mdi-weather-partly-cloudy' },
  3: { labelKey: 'wmo.3', icon: 'mdi-weather-cloudy' },
  45: { labelKey: 'wmo.45', icon: 'mdi-weather-fog' },
  48: { labelKey: 'wmo.48', icon: 'mdi-weather-fog' },
  51: { labelKey: 'wmo.51', icon: 'mdi-weather-partly-rainy' },
  53: { labelKey: 'wmo.53', icon: 'mdi-weather-partly-rainy' },
  55: { labelKey: 'wmo.55', icon: 'mdi-weather-rainy' },
  56: { labelKey: 'wmo.56', icon: 'mdi-weather-snowy-rainy' },
  57: { labelKey: 'wmo.57', icon: 'mdi-weather-snowy-rainy' },
  61: { labelKey: 'wmo.61', icon: 'mdi-weather-rainy' },
  63: { labelKey: 'wmo.63', icon: 'mdi-weather-rainy' },
  65: { labelKey: 'wmo.65', icon: 'mdi-weather-pouring' },
  66: { labelKey: 'wmo.66', icon: 'mdi-weather-snowy-rainy' },
  67: { labelKey: 'wmo.67', icon: 'mdi-weather-snowy-rainy' },
  71: { labelKey: 'wmo.71', icon: 'mdi-weather-snowy' },
  73: { labelKey: 'wmo.73', icon: 'mdi-weather-snowy' },
  75: { labelKey: 'wmo.75', icon: 'mdi-weather-snowy-heavy' },
  77: { labelKey: 'wmo.77', icon: 'mdi-weather-snowy' },
  80: { labelKey: 'wmo.80', icon: 'mdi-weather-partly-rainy' },
  81: { labelKey: 'wmo.81', icon: 'mdi-weather-rainy' },
  82: { labelKey: 'wmo.82', icon: 'mdi-weather-pouring' },
  85: { labelKey: 'wmo.85', icon: 'mdi-weather-snowy' },
  86: { labelKey: 'wmo.86', icon: 'mdi-weather-snowy-heavy' },
  95: { labelKey: 'wmo.95', icon: 'mdi-weather-lightning' },
  96: { labelKey: 'wmo.96', icon: 'mdi-weather-lightning-rainy' },
  99: { labelKey: 'wmo.99', icon: 'mdi-weather-lightning-rainy' },
}

const FALLBACK: Condition = { labelKey: 'wmo.unknown', icon: 'mdi-weather-cloudy-alert' }

// Look up a WMO code; unmapped codes return the non-empty fallback.
export function wmoToCondition(code: number): Condition {
  return WMO_TABLE[code] ?? FALLBACK
}
