import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Quotes', () => {
  test('quotes page loads', async ({ page }) => {
    await page.goto('/vendor/quotes')
    await expect(page).toHaveURL(/vendor\/quotes/)
    await page.waitForLoadState('networkidle')
  })

  test('quotes API returns data', async ({ page }) => {
    const res = await page.request.get('/api/quotes')
    expect(res.ok()).toBeTruthy()
  })
})
