import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Customer Quotes', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('quotes page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'quotes')
    await expect(page).toHaveURL(/quotes/)
    await page.waitForLoadState('networkidle')
  })

  test('services page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'services')
    await expect(page).toHaveURL(/services/)
    await page.waitForLoadState('networkidle')
  })
})
