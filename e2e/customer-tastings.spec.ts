import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Tasting Bookings', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('tastings page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'tastings')
    await expect(page).toHaveURL(/tastings/)
    await page.waitForLoadState('networkidle')
  })

  test('tastings API returns data', async ({ page }) => {
    const res = await page.request.get('/api/tastings')
    expect(res.ok()).toBeTruthy()
  })
})
