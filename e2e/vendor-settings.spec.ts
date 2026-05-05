import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Settings', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/vendor/settings')
    await expect(page).toHaveURL(/vendor\/settings/)
    await page.waitForLoadState('networkidle')
  })

  test('onboarding page loads', async ({ page }) => {
    await page.goto('/vendor/onboarding')
    await expect(page).toHaveURL(/vendor\/onboarding/)
    await page.waitForLoadState('networkidle')
  })
})
