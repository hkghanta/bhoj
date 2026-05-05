import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Payment Schedule', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('payment schedule page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'payment-schedule')
    await expect(page).toHaveURL(/payment-schedule/)
    await page.waitForLoadState('networkidle')
  })

  test('payment schedule API returns data', async ({ page }) => {
    const res = await page.request.get(`/api/events/${eventId}/payment-schedule`)
    expect(res.status()).toBeLessThan(500)
    const data = await res.json()
    expect(data).toBeTruthy()
  })
})
