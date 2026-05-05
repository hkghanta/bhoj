import { test as setup, expect } from '@playwright/test'

async function loginWithCredentials(page: import('@playwright/test').Page, email: string, password: string, role: string, expectedUrl: RegExp) {
  // Go to login page to get CSRF token from NextAuth
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Get CSRF token from NextAuth
  const csrfRes = await page.request.get('/api/auth/csrf')
  const { csrfToken } = await csrfRes.json()

  // Call NextAuth credentials endpoint directly
  const loginRes = await page.request.post('/api/auth/callback/credentials', {
    form: {
      email,
      password,
      role,
      csrfToken,
      json: 'true',
    },
  })

  // After setting cookies, navigate to target
  const targetUrl = role === 'vendor' ? '/vendor/dashboard' : '/dashboard'
  await page.goto(targetUrl)
  await expect(page).toHaveURL(expectedUrl, { timeout: 15_000 })
}

/**
 * Authenticate as the seed customer and save session state.
 */
setup('authenticate as customer', async ({ page }) => {
  await loginWithCredentials(page, 'priya@demo.oneseva', 'demo1234', 'customer', /dashboard/)
  await page.context().storageState({ path: 'e2e/.auth/customer.json' })
})

/**
 * Authenticate as the seed vendor and save session state.
 */
setup('authenticate as vendor', async ({ page }) => {
  await loginWithCredentials(page, 'spice@demo.oneseva', 'demo1234', 'vendor', /vendor/)
  await page.context().storageState({ path: 'e2e/.auth/vendor.json' })
})
