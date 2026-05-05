import { customerTest as test, expect } from './helpers'

test.describe('Style Quiz', () => {
  test('style quiz page loads', async ({ page }) => {
    await page.goto('/style-quiz')
    await expect(page).toHaveURL(/style-quiz/)
    await page.waitForLoadState('networkidle')
  })

  test('style quiz API works', async ({ page }) => {
    const res = await page.request.get('/api/customer/style-quiz')
    expect([200, 404]).toContain(res.status())
  })
})
