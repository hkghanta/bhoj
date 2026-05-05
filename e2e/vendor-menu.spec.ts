import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Menu', () => {
  test('menu page loads', async ({ page }) => {
    await page.goto('/vendor/menu')
    await expect(page).toHaveURL(/vendor\/menu/)
    await page.waitForLoadState('networkidle')
  })

  test('menu items API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/menu-items')
    expect(res.ok()).toBeTruthy()
  })
})
