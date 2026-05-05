import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Messages', () => {
  test('messages page loads', async ({ page }) => {
    await page.goto('/vendor/messages')
    await expect(page).toHaveURL(/vendor\/messages/)
    await page.waitForLoadState('networkidle')
  })
})
