import { customerTest as test, expect } from './helpers'

test.describe('Customer Messages', () => {
  test('messages page loads', async ({ page }) => {
    await page.goto('/messages')
    await expect(page).toHaveURL(/messages/)
    await page.waitForLoadState('networkidle')
  })

  test('conversations API returns data', async ({ page }) => {
    const res = await page.request.get('/api/conversations')
    expect(res.ok()).toBeTruthy()
  })
})
