import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Reviews', () => {
  test('reviews page loads', async ({ page }) => {
    await page.goto('/vendor/reviews')
    await expect(page).toHaveURL(/vendor\/reviews/)
    await page.waitForLoadState('networkidle')
  })
})
