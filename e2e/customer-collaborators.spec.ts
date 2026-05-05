import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Collaborators / Co-Planners', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('collaborators page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'collaborators')
    await expect(page).toHaveURL(/collaborators/)
    await page.waitForLoadState('networkidle')
  })

  test('collaborators API returns data', async ({ page }) => {
    const res = await page.request.get(`/api/events/${eventId}/collaborators`)
    expect(res.status()).toBeLessThan(500)
    const data = await res.json()
    expect(data).toBeTruthy()
  })
})
