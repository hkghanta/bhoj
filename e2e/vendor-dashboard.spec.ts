import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Dashboard', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/vendor/dashboard')
    await expect(page).toHaveURL(/vendor\/dashboard/)
    await page.waitForLoadState('networkidle')
  })

  test('vendor profile API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/profile')
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data.email).toBeTruthy()
  })
})
