import { vendorTest as test, expect } from './helpers'

test.describe('Vendor Pipeline (CRM)', () => {
  test('pipeline page loads', async ({ page }) => {
    await page.goto('/vendor/pipeline')
    await expect(page).toHaveURL(/vendor\/pipeline/)
    await page.waitForLoadState('networkidle')
  })

  test('pipeline API returns data', async ({ page }) => {
    const res = await page.request.get('/api/vendor/pipeline')
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    // Pipeline API returns entries grouped by stage (an object), not an array
    expect(typeof data === 'object' && data !== null).toBeTruthy()
  })
})
