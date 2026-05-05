import { customerTest as test, expect } from './helpers'

test.describe('Customer Profile', () => {
  test('profile page loads', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/profile/)
    await page.waitForLoadState('networkidle')
  })

  test('profile API returns data', async ({ page }) => {
    const res = await page.request.get('/api/customer/profile')
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data.email).toBeTruthy()
  })
})
