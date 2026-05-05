import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Billing', () => {
  test('billing page loads', async ({ page }) => {
    await page.goto('/vendor/billing')
    await expect(page).toHaveURL(/vendor\/billing/)
    await page.waitForLoadState('networkidle')
  })
})
