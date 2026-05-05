import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Instant Book', () => {
  test('instant book page loads', async ({ page }) => {
    await page.goto('/vendor/instant-book')
    await expect(page).toHaveURL(/vendor\/instant-book/)
    await page.waitForLoadState('networkidle')
  })

  test('instant book API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/instant-book')
    expect(res.ok()).toBeTruthy()
  })
})
