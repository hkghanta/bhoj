import { test, expect } from '@playwright/test'

test.describe('Public Pages', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await page.waitForLoadState('networkidle')
  })

  test('vendor browse page loads', async ({ page }) => {
    await page.goto('/vendors')
    await expect(page).toHaveURL(/vendors/)
    await page.waitForLoadState('networkidle')
  })

  test('search page loads', async ({ page }) => {
    await page.goto('/search')
    await expect(page).toHaveURL(/search/)
    await page.waitForLoadState('networkidle')
  })

  test('for-vendors page loads', async ({ page }) => {
    await page.goto('/for-vendors')
    await expect(page).toHaveURL(/for-vendors/)
    await page.waitForLoadState('networkidle')
  })

  test('instant book page loads', async ({ page }) => {
    await page.goto('/instant-book')
    await expect(page).toHaveURL(/instant-book/)
    await page.waitForLoadState('networkidle')
  })

  test('dishes page loads', async ({ page }) => {
    await page.goto('/dishes')
    await expect(page).toHaveURL(/dishes/)
    await page.waitForLoadState('networkidle')
  })

  test('concierge page loads', async ({ page }) => {
    await page.goto('/concierge')
    await expect(page).toHaveURL(/concierge/)
    await page.waitForLoadState('networkidle')
  })

  test('health check API', async ({ page }) => {
    const res = await page.request.get('/api/health')
    expect(res.ok()).toBeTruthy()
  })
})
