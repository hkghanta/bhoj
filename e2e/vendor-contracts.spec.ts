import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Contracts', () => {
  test('contracts page loads', async ({ page }) => {
    await page.goto('/vendor/contracts')
    await expect(page).toHaveURL(/vendor\/contracts/)
    await page.waitForLoadState('networkidle')
  })

  test('contracts API returns data', async ({ page }) => {
    const res = await page.request.get('/api/contracts')
    expect(res.ok()).toBeTruthy()
  })
})
