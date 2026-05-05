import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Schedule', () => {
  test('schedule page loads', async ({ page }) => {
    await page.goto('/vendor/schedule')
    await expect(page).toHaveURL(/vendor\/schedule/)
    await page.waitForLoadState('networkidle')
  })

  test('schedule API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/schedule')
    expect(res.ok()).toBeTruthy()
  })
})
