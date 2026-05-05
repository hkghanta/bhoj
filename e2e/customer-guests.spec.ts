import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Guest Management', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('guests page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'guests')
    await expect(page).toHaveURL(/guests/)
    await page.waitForLoadState('networkidle')
  })

  test('guests API returns data', async ({ page }) => {
    const res = await page.request.get(`/api/events/${eventId}/guests`)
    expect(res.status()).toBeLessThan(500)
    const data = await res.json()
    expect(data).toBeTruthy()
  })
})
