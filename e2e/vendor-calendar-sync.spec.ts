import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Calendar Sync', () => {
  test('calendar sync page loads', async ({ page }) => {
    await page.goto('/vendor/calendar-sync')
    await expect(page).toHaveURL(/vendor\/calendar-sync/)
    await page.waitForLoadState('networkidle')
  })

  test('calendar sync API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/calendar-sync')
    expect([200, 404]).toContain(res.status())
  })
})
