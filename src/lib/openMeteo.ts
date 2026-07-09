import axios from 'axios'

import type { CurrentWeather, DailyForecast, GeoCity, HourlyForecast } from '@/types/weather'

// axios = the HTTP layer. One shared client; no baseURL because Open-Meteo splits
// geocoding and forecast across two hosts, so each call passes a full URL.
const http = axios.create({ timeout: 10_000 })

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

// Raw shapes of the two API responses, typed locally so no `any` leaks (strict mode).
interface GeocodingResponse {
  results?: GeoCity[]
}

interface ForecastResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    weather_code: number
    wind_speed_10m: number
    apparent_temperature: number
    precipitation: number
    uv_index: number
  }
  daily: {
    sunrise: string[]
    sunset: string[]
  }
}

// Raw shape of the daily-forecast response, typed locally so no `any` leaks.
interface DailyForecastResponse {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
  }
}

// Raw shape of the hourly-forecast response, typed locally so no `any` leaks (T-06-05).
interface HourlyForecastResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation: number[]
  }
}

// Resolve a free-text city name to coordinate candidates. Returns [] when nothing
// matches - that empty array is the "city not found" signal the UI relies on (D-08).
export async function geocodeCity(name: string, signal?: AbortSignal): Promise<GeoCity[]> {
  const response = await http.get<GeocodingResponse>(GEOCODING_URL, {
    // Pass via params so axios URL-encodes the user input (never string-concatenate).
    params: { name, count: 5, language: 'en', format: 'json' },
    signal,
  })
  return response.data.results ?? []
}

// Fetch current conditions for a lat/lon and normalize the API's snake_case `current`
// object into our CurrentWeather shape. Units stay metric (°C, km/h).
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const response = await http.get<ForecastResponse>(FORECAST_URL, {
    params: {
      latitude,
      longitude,
      current:
        'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature,precipitation,uv_index',
      wind_speed_unit: 'kmh',
      // Sunrise/sunset ride along in the SAME request (one daily point, forecast_days=1)
      // so this stays a single HTTP call instead of a second round trip.
      daily: 'sunrise,sunset',
      forecast_days: 1,
      // timezone=auto so sunrise/sunset are the city's local wall-clock times.
      timezone: 'auto',
    },
    signal,
  })
  const { current, daily } = response.data
  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    feelsLike: current.apparent_temperature,
    precipitation: current.precipitation,
    uvIndex: current.uv_index,
    sunrise: daily.sunrise[0],
    sunset: daily.sunset[0],
  }
}

// Fetch a multi-day forecast for a lat/lon and normalize the API's snake_case `daily`
// object into our DailyForecast (parallel arrays). axios = the HTTP layer; same shared
// `http` client and FORECAST_URL as the current-weather call. Units stay metric (°C).
export async function fetchForecast(
  latitude: number,
  longitude: number,
  days = 7,
  signal?: AbortSignal,
): Promise<DailyForecast> {
  const response = await http.get<DailyForecastResponse>(FORECAST_URL, {
    params: {
      latitude,
      longitude,
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      forecast_days: days,
      // timezone=auto so the daily buckets align with the city's local calendar days.
      timezone: 'auto',
    },
    // signal comes from Vue Query so superseded fetches (rapid city switching) abort.
    signal,
  })
  const { daily } = response.data
  return {
    dates: daily.time,
    tempMax: daily.temperature_2m_max,
    tempMin: daily.temperature_2m_min,
    weatherCodes: daily.weather_code,
  }
}

// Fetch an hourly forecast for a lat/lon and normalize the API's snake_case `hourly` object
// into our HourlyForecast (parallel arrays). Same shared `http` client + FORECAST_URL as the
// other forecast calls. forecast_days=1 keeps the window at 24 points so the mixed chart stays
// readable (Pitfall 5). Units stay metric (°C, mm); the temperature toggle is applied at display.
export async function fetchHourlyForecast(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<HourlyForecast> {
  const response = await http.get<HourlyForecastResponse>(FORECAST_URL, {
    params: {
      latitude,
      longitude,
      // Pass values via params so axios URL-encodes them (never string-concatenate - T-06-04).
      hourly: 'temperature_2m,precipitation',
      forecast_days: 1,
      // timezone=auto so the hourly buckets align with the city's local clock.
      timezone: 'auto',
    },
    // signal comes from Vue Query so superseded fetches (rapid city switching) abort.
    signal,
  })
  const { hourly } = response.data
  return {
    times: hourly.time,
    temperature: hourly.temperature_2m,
    precipitation: hourly.precipitation,
  }
}
