import { customerTest as test, expect, getFirstEventId } from './helpers'

test.describe('Customer Dashboard', () => {
  test('dashboard loads with events', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/dashboard/)
    // Should show at least the seed event
    await expect(page.locator('a[href*="/events/"]').first()).toBeVisible({ timeout: 10_000 })
  })

  test('can navigate to event detail', async ({ page }) => {
    const eventId = await getFirstEventId(page)
    await page.goto(`/events/${eventId}`)
    await expect(page).toHaveURL(`/events/${eventId}`)
    await page.waitForLoadState('networkidle')
  })

  test('event page shows planning tools', async ({ page }) => {
    const eventId = await getFirstEventId(page)
    await page.goto(`/events/${eventId}`)
    await page.waitForLoadState('networkidle')
    // The page has an h2 "Planning Tools" heading
    await expect(page.locator('h2').filter({ hasText: 'Planning Tools' })).toBeVisible({ timeout: 15_000 })
  })

  test('can navigate to create new event', async ({ page }) => {
    await page.goto('/events/new')
    await expect(page).toHaveURL(/events\/new/)
  })
})
