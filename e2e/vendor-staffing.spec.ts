import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Staffing', () => {
  test('staffing page loads', async ({ page }) => {
    await page.goto('/vendor/staffing')
    await expect(page).toHaveURL(/vendor\/staffing/)
    await page.waitForLoadState('networkidle')
  })

  test('staffing API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/staffing')
    expect(res.ok()).toBeTruthy()
  })
})
