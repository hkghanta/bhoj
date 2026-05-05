import { customerTest as test, expect } from './helpers'

test.describe('Mood Boards', () => {
  test('mood boards page loads', async ({ page }) => {
    await page.goto('/mood-boards')
    await expect(page).toHaveURL(/mood-boards/)
    await page.waitForLoadState('networkidle')
  })

  test('mood boards API returns data', async ({ page }) => {
    const res = await page.request.get('/api/mood-boards')
    expect(res.ok()).toBeTruthy()
  })
})
