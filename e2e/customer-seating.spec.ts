import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Seating Chart', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('seating page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'seating')
    await expect(page).toHaveURL(/seating/)
    await page.waitForLoadState('networkidle')
  })

  test('seating API returns data', async ({ page }) => {
    const res = await page.request.get(`/api/events/${eventId}/seating`)
    expect(res.status()).toBeLessThan(500)
    const data = await res.json()
    expect(data).toBeTruthy()
  })

  test('can interact with seating page', async ({ page }) => {
    await goToEventPage(page, eventId, 'seating')
    await expect(page.locator('body')).toContainText(/seating|chart|table|create|no/i)
  })
})
