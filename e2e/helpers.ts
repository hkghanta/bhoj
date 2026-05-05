import { test as base, expect, type Page } from '@playwright/test'

/** Customer test — uses customer auth state */
export const customerTest = base.extend({
  storageState: 'e2e/.auth/customer.json',
})

/** Vendor test — uses vendor auth state */
export const vendorTest = base.extend({
  storageState: 'e2e/.auth/vendor.json',
})

/** Get first event ID from the events API (prefers wedding type) */
export async function getFirstEventId(page: Page): Promise<string> {
  const res = await page.request.get('/api/events')
  const events = await res.json()
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('No events found')
  }
  // Prefer a wedding event (more features/pages available)
  const wedding = events.find((e: { event_type?: string }) => e.event_type === 'wedding')
  return (wedding || events[0]).id
}

/** Navigate to event sub-page */
export async function goToEventPage(page: Page, eventId: string, subPage: string) {
  await page.goto(`/events/${eventId}/${subPage}`)
  await page.waitForLoadState('networkidle')
}

export { expect }
