import { customerTest as test, expect } from './helpers'

test.describe('Favorites', () => {
  test('favorites page loads', async ({ page }) => {
    await page.goto('/favorites')
    await expect(page).toHaveURL(/favorites/)
    await page.waitForLoadState('networkidle')
    // Should show favorites list or empty state
    await expect(page.locator('body')).toContainText(/favorite|saved|no/i)
  })

  test('favorites API returns data', async ({ page }) => {
    const res = await page.request.get('/api/favorites')
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBeTruthy()
  })
})
