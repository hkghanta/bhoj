import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Photos', () => {
  test('photos page loads', async ({ page }) => {
    await page.goto('/vendor/photos')
    await expect(page).toHaveURL(/vendor\/photos/)
    await page.waitForLoadState('networkidle')
  })

  test('photos API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/photos')
    expect(res.ok()).toBeTruthy()
  })
})
