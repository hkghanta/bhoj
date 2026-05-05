import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Sign in to OneSeva')).toBeVisible()
    await expect(page.getByRole('button', { name: /Customer — Priya/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Vendor — Spice Route/i })).toBeVisible()
  })

  test('customer demo login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /Customer — Priya/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })
  })

  test('vendor demo login redirects to vendor dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /Vendor — Spice Route/i }).click()
    await expect(page).toHaveURL(/vendor\/dashboard/, { timeout: 15_000 })
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('bad@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10_000 })
  })

  test('customer registration page loads', async ({ page }) => {
    await page.goto('/register/customer')
    await expect(page).toHaveURL(/register\/customer/)
  })

  test('vendor registration page loads', async ({ page }) => {
    await page.goto('/register/vendor')
    await expect(page).toHaveURL(/register\/vendor/)
  })
})
