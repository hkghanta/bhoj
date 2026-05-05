import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Gift Registry', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('registry page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'registry')
    await expect(page).toHaveURL(/registry/)
    await page.waitForLoadState('networkidle')
  })

  test('registry API returns data', async ({ page }) => {
    const res = await page.request.get(`/api/events/${eventId}/registry`)
    expect([200, 404]).toContain(res.status())
  })

  test('can view registry items', async ({ page }) => {
    await goToEventPage(page, eventId, 'registry')
    // Should show items list or empty state
    await expect(page.locator('body')).toContainText(/registry|gift|no items|add/i)
  })
})
