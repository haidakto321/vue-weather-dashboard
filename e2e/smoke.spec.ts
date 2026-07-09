// e2e/smoke.spec.ts - search -> card -> detail -> forecast list + chart render.
// Reuses the app's existing data-testid convention (forecast-list/forecast-chart/hourly-chart)
// plus two additive testids (city-search, weather-card - Pitfall 8).
import { test, expect } from '@playwright/test'

test('search a city, see its card, open the detail page, see forecast + charts render', async ({
  page,
}) => {
  await page.goto('/')

  // data-testid sits on Vuetify's outer wrapper div, not the actual <input> -
  // locate the input inside it for click/fill.
  const searchInput = page.getByTestId('city-search').locator('input')
  await searchInput.click()
  await searchInput.fill('London')

  // Auto-waiting locator: no manual sleep for the 300ms debounce (Pitfall 7).
  const option = page.getByRole('option', { name: /London/ }).first()
  await option.waitFor()
  await option.click()

  const card = page.getByTestId('weather-card').filter({ hasText: 'London' })
  await expect(card).toBeVisible()

  await card.click()

  await expect(page.getByTestId('forecast-list')).toBeVisible()
  await expect(page.getByTestId('forecast-chart')).toBeVisible()
  await expect(page.getByTestId('hourly-chart')).toBeVisible()
})
