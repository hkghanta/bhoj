import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Auto-Quote Rules', () => {
  test('auto-quotes page loads', async ({ page }) => {
    await page.goto('/vendor/auto-quotes')
    await expect(page).toHaveURL(/vendor\/auto-quotes/)
    await page.waitForLoadState('networkidle')
  })

  test('auto-quote rules API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/auto-quote-rules')
    expect(res.ok()).toBeTruthy()
  })
})
