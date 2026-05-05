import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Equipment', () => {
  test('equipment page loads', async ({ page }) => {
    await page.goto('/vendor/equipment')
    await expect(page).toHaveURL(/vendor\/equipment/)
    await page.waitForLoadState('networkidle')
  })

  test('equipment API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/equipment')
    expect(res.ok()).toBeTruthy()
  })
})
