import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Stations', () => {
  test('stations page loads', async ({ page }) => {
    await page.goto('/vendor/stations')
    await expect(page).toHaveURL(/vendor\/stations/)
    await page.waitForLoadState('networkidle')
  })

  test('stations API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/stations')
    expect(res.ok()).toBeTruthy()
  })
})
