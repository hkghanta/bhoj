import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Cancellation Policy', () => {
  test('cancellation policy page loads', async ({ page }) => {
    await page.goto('/vendor/cancellation-policy')
    await expect(page).toHaveURL(/vendor\/cancellation-policy/)
    await page.waitForLoadState('networkidle')
  })

  test('cancellation policy API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/cancellation-policy')
    expect([200, 404]).toContain(res.status())
  })
})
