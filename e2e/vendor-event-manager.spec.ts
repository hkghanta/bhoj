import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Event Manager', () => {
  test('event manager page loads', async ({ page }) => {
    await page.goto('/vendor/event-manager')
    await expect(page).toHaveURL(/vendor\/event-manager/)
    await page.waitForLoadState('networkidle')
  })

  test('event manager API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/event-manager')
    expect(res.ok()).toBeTruthy()
  })
})
