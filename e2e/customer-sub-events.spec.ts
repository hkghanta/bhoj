import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Sub Events', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('sub-events page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'sub-events')
    await expect(page).toHaveURL(/sub-events/)
    await page.waitForLoadState('networkidle')
  })

  test('sub-events API returns data', async ({ page }) => {
    const res = await page.request.get(`/api/events/${eventId}/sub-events`)
    expect(res.status()).toBeLessThan(500)
    const data = await res.json()
    expect(data).toBeTruthy()
  })
})
