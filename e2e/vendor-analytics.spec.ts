import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Analytics', () => {
  test('analytics page loads', async ({ page }) => {
    await page.goto('/vendor/analytics')
    await expect(page).toHaveURL(/vendor\/analytics/)
    await page.waitForLoadState('networkidle')
  })

  test('analytics API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/analytics')
    expect(res.ok()).toBeTruthy()
  })
})
