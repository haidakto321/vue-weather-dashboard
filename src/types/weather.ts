// Shared weather contracts for Phase 2. Defined once here and consumed across the
// axios client, the Pinia store, the composable, and the UI. Because
// verbatimModuleSyntax is on, downstream files import these with `import type`.

// One Open-Meteo geocoding result. Field names match the API response exactly.
export interface GeoCity {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
  country_code?: string
}

// What the cities store holds: a stable dedupe `key` plus display/coordinate fields.
export interface SavedCity {
  key: string
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
}

// Normalized current conditions (metric: °C, km/h, %). The unit toggle is Phase 4.
export interface CurrentWeather {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
}

// A multi-day forecast (Phase 3, WTHR-02). Stored as four parallel arrays that share
// the same length and index order (index i = day i). Parallel arrays map cleanly to
// both the per-day list and the Chart.js datasets without any reshaping. Metric (°C);
// the unit toggle is Phase 4.
export interface DailyForecast {
  dates: string[] // ISO YYYY-MM-DD, one per day
  tempMax: number[] // daily high, °C
  tempMin: number[] // daily low, °C
  weatherCodes: number[] // WMO weather code per day
}
