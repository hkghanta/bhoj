import { customerTest, vendorTest, expect } from './helpers'

/**
 * Smoke tests: hit every major API endpoint and verify it doesn't 500.
 */
customerTest.describe('Customer API Smoke Tests', () => {
  customerTest('GET /api/events', async ({ page }) => {
    const res = await page.request.get('/api/events')
    expect(res.ok()).toBeTruthy()
  })

  customerTest('GET /api/favorites', async ({ page }) => {
    const res = await page.request.get('/api/favorites')
    expect(res.ok()).toBeTruthy()
  })

  customerTest('GET /api/mood-boards', async ({ page }) => {
    const res = await page.request.get('/api/mood-boards')
    expect(res.ok()).toBeTruthy()
  })

  customerTest('GET /api/conversations', async ({ page }) => {
    const res = await page.request.get('/api/conversations')
    expect(res.ok()).toBeTruthy()
  })

  customerTest('GET /api/customer/profile', async ({ page }) => {
    const res = await page.request.get('/api/customer/profile')
    expect(res.ok()).toBeTruthy()
  })

  customerTest('GET /api/customer/style-quiz', async ({ page }) => {
    const res = await page.request.get('/api/customer/style-quiz')
    expect([200, 404]).toContain(res.status())
  })

  customerTest('GET /api/customer/spend-analytics', async ({ page }) => {
    const res = await page.request.get('/api/customer/spend-analytics')
    expect(res.ok()).toBeTruthy()
  })

  customerTest('GET /api/tastings', async ({ page }) => {
    const res = await page.request.get('/api/tastings')
    expect(res.ok()).toBeTruthy()
  })

  customerTest('GET /api/contracts', async ({ page }) => {
    const res = await page.request.get('/api/contracts')
    expect(res.ok()).toBeTruthy()
  })
})

vendorTest.describe('Vendor API Smoke Tests', () => {
  vendorTest('GET /api/vendor/profile', async ({ page }) => {
    const res = await page.request.get('/api/vendor/profile')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/services', async ({ page }) => {
    const res = await page.request.get('/api/vendor/services')
    // This endpoint only has POST — GET returns 405 Method Not Allowed
    expect([200, 405]).toContain(res.status())
  })

  vendorTest('GET /api/vendor/equipment', async ({ page }) => {
    const res = await page.request.get('/api/vendor/equipment')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/photos', async ({ page }) => {
    const res = await page.request.get('/api/vendor/photos')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/stations', async ({ page }) => {
    const res = await page.request.get('/api/vendor/stations')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/pipeline', async ({ page }) => {
    const res = await page.request.get('/api/vendor/pipeline')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/analytics', async ({ page }) => {
    const res = await page.request.get('/api/vendor/analytics')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/availability', async ({ page }) => {
    const res = await page.request.get('/api/vendor/availability')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/instant-book', async ({ page }) => {
    const res = await page.request.get('/api/vendor/instant-book')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/auto-quote-rules', async ({ page }) => {
    const res = await page.request.get('/api/vendor/auto-quote-rules')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/workflows', async ({ page }) => {
    const res = await page.request.get('/api/vendor/workflows')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/message-templates', async ({ page }) => {
    const res = await page.request.get('/api/vendor/message-templates')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/staffing', async ({ page }) => {
    const res = await page.request.get('/api/vendor/staffing')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/credits', async ({ page }) => {
    const res = await page.request.get('/api/vendor/credits')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/schedule', async ({ page }) => {
    const res = await page.request.get('/api/vendor/schedule')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/menu-items', async ({ page }) => {
    const res = await page.request.get('/api/vendor/menu-items')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/vendor/cancellation-policy', async ({ page }) => {
    const res = await page.request.get('/api/vendor/cancellation-policy')
    expect([200, 404]).toContain(res.status())
  })

  vendorTest('GET /api/vendor/calendar-sync', async ({ page }) => {
    const res = await page.request.get('/api/vendor/calendar-sync')
    expect([200, 404]).toContain(res.status())
  })

  vendorTest('GET /api/vendor/event-manager', async ({ page }) => {
    const res = await page.request.get('/api/vendor/event-manager')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/quotes', async ({ page }) => {
    const res = await page.request.get('/api/quotes')
    expect(res.ok()).toBeTruthy()
  })

  vendorTest('GET /api/contracts', async ({ page }) => {
    const res = await page.request.get('/api/contracts')
    expect(res.ok()).toBeTruthy()
  })
})
