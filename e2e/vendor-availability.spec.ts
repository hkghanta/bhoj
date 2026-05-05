import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Availability', () => {
  test('availability page loads', async ({ page }) => {
    await page.goto('/vendor/availability')
    await expect(page).toHaveURL(/vendor\/availability/)
    await page.waitForLoadState('networkidle')
  })

  test('availability API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/availability')
    expect(res.ok()).toBeTruthy()
  })
})
