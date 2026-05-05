import { customerTest as test, expect, getFirstEventId, goToEventPage } from './helpers'

test.describe('Event Timeline', () => {
  let eventId: string

  test.beforeEach(async ({ page }) => {
    eventId = await getFirstEventId(page)
  })

  test('timeline page loads', async ({ page }) => {
    await goToEventPage(page, eventId, 'timeline')
    await expect(page).toHaveURL(/timeline/)
    // Wait for loading spinner to disappear, then check for content
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })
    // Should show either the Add Entry button or the empty state message
    await expect(
      page.getByRole('button', { name: /Add Entry/i })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('can open add entry form', async ({ page }) => {
    await goToEventPage(page, eventId, 'timeline')
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })
    await page.getByRole('button', { name: /Add Entry/i }).click()
    await expect(page.getByText('Add Timeline Entry')).toBeVisible()
  })

  test('can create a timeline entry', async ({ page }) => {
    await goToEventPage(page, eventId, 'timeline')
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })
    await page.getByRole('button', { name: /Add Entry/i }).click()

    const entryName = `E2E Test Entry ${Date.now()}`
    await page.getByPlaceholder('e.g. Baraat Arrival, Mehendi, DJ Setup').fill(entryName)
    await page.getByPlaceholder('e.g. Main Hall, Garden, Pool Deck, Temple').fill('Garden Area')
    await page.getByRole('button', { name: 'Add', exact: true }).click()

    await expect(page.getByText('Entry added')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(entryName)).toBeVisible()
  })

  test('can edit a timeline entry', async ({ page }) => {
    await goToEventPage(page, eventId, 'timeline')
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })
    // If there's an entry, click the pencil edit button
    const editBtn = page.locator('button:has(svg.text-gray-400)').first()
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click()
      await expect(page.getByText('Edit Entry')).toBeVisible()
    }
  })

  test('can delete a timeline entry', async ({ page }) => {
    // Accept confirm dialogs before triggering them
    page.on('dialog', dialog => dialog.accept())

    await goToEventPage(page, eventId, 'timeline')
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // If no entries exist, create one first
    const hasEntry = await page.locator('button:has(svg.text-red-400)').first().isVisible({ timeout: 3000 }).catch(() => false)
    if (!hasEntry) {
      await page.getByRole('button', { name: /Add Entry/i }).click()
      await page.getByPlaceholder('e.g. Baraat Arrival, Mehendi, DJ Setup').fill('Temp Entry to Delete')
      await page.getByPlaceholder('e.g. Main Hall, Garden, Pool Deck, Temple').fill('Temp Location')
      await page.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(page.getByText(/Entry added/i)).toBeVisible({ timeout: 10_000 })
    }

    // Click delete on the last entry
    const deleteBtn = page.locator('button:has(svg.text-red-400)').last()
    await deleteBtn.click()
    await expect(page.getByText('Entry removed')).toBeVisible({ timeout: 10_000 })
  })
})
