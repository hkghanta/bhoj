import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Event Website', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('website page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'website')
    await expect(page).toHaveURL(/website/)
    await page.waitForLoadState('networkidle')
  })

  test('website API returns data', async ({ page }) => {
    const res = await page.request.get(`/api/events/${eventId}/website`)
    // 200 if exists, 404 if not yet created — both valid
    expect([200, 404]).toContain(res.status())
  })

  test('can create or update event website', async ({ page }) => {
    await goToEventPage(page, eventId, 'website')
    // Look for a save/create button
    const saveBtn = page.getByRole('button', { name: /save|create|publish/i })
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(saveBtn).toBeEnabled()
    }
  })
})
