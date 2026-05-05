import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Leads', () => {
  test('leads page loads', async ({ page }) => {
    await page.goto('/vendor/leads')
    await expect(page).toHaveURL(/vendor\/leads/)
    await page.waitForLoadState('networkidle')
  })
})
