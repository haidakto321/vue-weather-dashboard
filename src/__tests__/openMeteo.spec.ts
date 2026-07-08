// @vitest-environment node
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import {
  geocodeCity,
  fetchCurrentWeather,
  fetchForecast,
  fetchHourlyForecast,
} from '@/lib/openMeteo'

// MSW's one obvious job here: it intercepts Node's http layer (this spec runs in the
// node environment via the first-line docblock, so axios uses its http adapter - the
// most reliable interception path). That means these tests exercise the REAL openMeteo.ts
// code - actual URLs, axios param serialization, and error shaping - with ZERO live
// network. We import the real functions (no vi.mock) so the HTTP boundary is genuinely
// tested. onUnhandledRequest: 'error' makes any un-mocked request fail loudly, so a
// stray call to the real Open-Meteo API can never slip through.
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('openMeteo API layer (MSW node tests)', () => {
  describe('geocodeCity', () => {
    it('sends the search term as an encoded name param and returns the normalized city array (success)', async () => {
      // Assert the exact query params axios serializes, then return an Open-Meteo-shaped
      // geocoding payload. A non-ASCII name proves axios URL-encodes user input.
      server.use(
        http.get(GEOCODING_URL, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('name')).toBe('São Paulo')
          expect(url.searchParams.get('count')).toBe('5')
          expect(url.searchParams.get('language')).toBe('en')
          expect(url.searchParams.get('format')).toBe('json')
          return HttpResponse.json({
            results: [
              {
                id: 3448439,
                name: 'São Paulo',
                latitude: -23.5475,
                longitude: -46.6361,
                country: 'Brazil',
                admin1: 'São Paulo',
              },
            ],
          })
        }),
      )

      const cities = await geocodeCity('São Paulo')

      expect(cities).toHaveLength(1)
      expect(cities[0]).toMatchObject({
        id: 3448439,
        name: 'São Paulo',
        latitude: -23.5475,
        longitude: -46.6361,
        country: 'Brazil',
      })
    })

    it('returns [] when the response JSON has no results key (empty result)', async () => {
      // Open-Meteo omits `results` entirely when nothing matches; the `?? []` fallback in
      // openMeteo.ts is the "city not found" signal the UI relies on.
      server.use(http.get(GEOCODING_URL, () => HttpResponse.json({})))

      await expect(geocodeCity('nowhere-xyz')).resolves.toEqual([])
    })

    it('rejects on a network error (error shape)', async () => {
      server.use(http.get(GEOCODING_URL, () => HttpResponse.error()))

      await expect(geocodeCity('London')).rejects.toBeTruthy()
    })
  })

  describe('fetchCurrentWeather', () => {
    it('normalizes the snake_case current object into the camelCase CurrentWeather shape (success)', async () => {
      // The API returns a snake_case `current` block; openMeteo.ts maps it to our
      // camelCase CurrentWeather (temperature_2m -> temperature, etc).
      server.use(
        http.get(FORECAST_URL, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('latitude')).toBe('51.5085')
          expect(url.searchParams.get('longitude')).toBe('-0.1257')
          expect(url.searchParams.get('current')).toBe(
            'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
          )
          expect(url.searchParams.get('wind_speed_unit')).toBe('kmh')
          return HttpResponse.json({
            current: {
              temperature_2m: 14.2,
              relative_humidity_2m: 72,
              weather_code: 3,
              wind_speed_10m: 18.5,
            },
          })
        }),
      )

      const weather = await fetchCurrentWeather(51.5085, -0.1257)

      expect(weather).toEqual({
        temperature: 14.2,
        humidity: 72,
        weatherCode: 3,
        windSpeed: 18.5,
      })
    })

    it('rejects with the HTTP status on a 500 (error shape)', async () => {
      // A 500 from the forecast host must surface as an axios error exposing response.status.
      server.use(http.get(FORECAST_URL, () => new HttpResponse(null, { status: 500 })))

      await expect(fetchCurrentWeather(51.5, -0.12)).rejects.toMatchObject({
        response: { status: 500 },
      })
    })
  })

  describe('fetchForecast', () => {
    it('normalizes the snake_case daily arrays into the DailyForecast parallel arrays (success)', async () => {
      // openMeteo.ts remaps daily.time -> dates, temperature_2m_max -> tempMax, etc, and
      // requests forecast_days = the days argument with timezone=auto.
      server.use(
        http.get(FORECAST_URL, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('daily')).toBe(
            'temperature_2m_max,temperature_2m_min,weather_code',
          )
          expect(url.searchParams.get('forecast_days')).toBe('3')
          expect(url.searchParams.get('timezone')).toBe('auto')
          return HttpResponse.json({
            daily: {
              time: ['2026-07-08', '2026-07-09', '2026-07-10'],
              temperature_2m_max: [21, 22, 19],
              temperature_2m_min: [12, 13, 11],
              weather_code: [0, 3, 61],
            },
          })
        }),
      )

      const forecast = await fetchForecast(51.5, -0.12, 3)

      expect(forecast).toEqual({
        dates: ['2026-07-08', '2026-07-09', '2026-07-10'],
        tempMax: [21, 22, 19],
        tempMin: [12, 13, 11],
        weatherCodes: [0, 3, 61],
      })
    })

    it('rejects on a network error (error shape)', async () => {
      server.use(http.get(FORECAST_URL, () => HttpResponse.error()))

      await expect(fetchForecast(51.5, -0.12)).rejects.toBeTruthy()
    })
  })

  describe('fetchHourlyForecast', () => {
    it('normalizes the snake_case hourly arrays into the HourlyForecast parallel arrays (success)', async () => {
      // openMeteo.ts remaps hourly.time -> times, temperature_2m -> temperature,
      // precipitation -> precipitation, and requests forecast_days=1 with timezone=auto.
      server.use(
        http.get(FORECAST_URL, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('hourly')).toBe('temperature_2m,precipitation')
          expect(url.searchParams.get('forecast_days')).toBe('1')
          expect(url.searchParams.get('timezone')).toBe('auto')
          return HttpResponse.json({
            hourly: {
              time: ['2026-07-08T00:00', '2026-07-08T01:00', '2026-07-08T02:00'],
              temperature_2m: [14, 13.5, 13],
              precipitation: [0, 0.2, 1.1],
            },
          })
        }),
      )

      const hourly = await fetchHourlyForecast(51.5, -0.12)

      expect(hourly).toEqual({
        times: ['2026-07-08T00:00', '2026-07-08T01:00', '2026-07-08T02:00'],
        temperature: [14, 13.5, 13],
        precipitation: [0, 0.2, 1.1],
      })
    })

    it('rejects on a network error (error shape)', async () => {
      server.use(http.get(FORECAST_URL, () => HttpResponse.error()))

      await expect(fetchHourlyForecast(51.5, -0.12)).rejects.toBeTruthy()
    })
  })
})
