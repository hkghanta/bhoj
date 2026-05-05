import { customerTest as test, expect } from './helpers'

test.describe('Spend Analytics', () => {
  test('spend analytics page loads', async ({ page }) => {
    await page.goto('/spend-analytics')
    await expect(page).toHaveURL(/spend-analytics/)
    await page.waitForLoadState('networkidle')
  })

  test('spend analytics API returns data', async ({ page }) => {
    const res = await page.request.get('/api/customer/spend-analytics')
    expect(res.ok()).toBeTruthy()
  })
})
