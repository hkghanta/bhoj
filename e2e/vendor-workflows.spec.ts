import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Workflows', () => {
  test('workflows page loads', async ({ page }) => {
    await page.goto('/vendor/workflows')
    await expect(page).toHaveURL(/vendor\/workflows/)
    await page.waitForLoadState('networkidle')
  })

  test('workflows API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/workflows')
    expect(res.ok()).toBeTruthy()
  })
})
