import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Credits', () => {
  test('credits page loads', async ({ page }) => {
    await page.goto('/vendor/credits')
    await expect(page).toHaveURL(/vendor\/credits/)
    await page.waitForLoadState('networkidle')
  })

  test('credits API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/credits')
    expect(res.ok()).toBeTruthy()
  })
})
