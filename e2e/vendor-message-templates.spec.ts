import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Message Templates', () => {
  test('message templates page loads', async ({ page }) => {
    await page.goto('/vendor/message-templates')
    await expect(page).toHaveURL(/vendor\/message-templates/)
    await page.waitForLoadState('networkidle')
  })

  test('message templates API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/message-templates')
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBeTruthy()
  })
})
