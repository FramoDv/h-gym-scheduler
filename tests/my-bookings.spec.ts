/**
 * "Le mie prenotazioni" page tests.
 *
 * Covers:
 * - Empty state when no bookings
 * - Booking made on dashboard appears in the list
 * - List is in chronological ascending order (earliest slot first)
 * - Cancelling a booking via the trash icon removes it
 * - Page is reachable from the nav link
 */
import { test, expect, type Page } from '@playwright/test'
import { getAccessToken, clearMyBookings, waitForSlotsLoaded } from './helpers'

test.describe('Le mie prenotazioni', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.goto('/')
    const token = await getAccessToken(page)
    await clearMyBookings(request, token)
    // Navigate fresh so UI reflects cleared state
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible({
      timeout: 8_000,
    })
  })

  test('shows empty state when there are no bookings', async ({ page }) => {
    await page.goto('/my-bookings')

    await expect(page.getByRole('heading', { name: 'Le mie prenotazioni' })).toBeVisible()
    await expect(page.getByText('Nessuna prenotazione')).toBeVisible({ timeout: 8_000 })
    await expect(
      page.getByText('Vai nella dashboard per prenotare uno slot')
    ).toBeVisible()
  })

  test('reachable from the navigation link', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Le mie prenotazioni' }).first().click()
    await expect(page).toHaveURL(/\/my-bookings$/)
    await expect(page.getByRole('heading', { name: 'Le mie prenotazioni' })).toBeVisible()
  })

  test('newly booked slot appears in the list', async ({ page }) => {
    // Book a slot via the dashboard
    await waitForSlotsLoaded(page)

    const prenotaBtn = await findFirstPrenotaButton(page)
    if (!prenotaBtn) {
      test.skip()
      return
    }

    await prenotaBtn.click()
    await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })

    // Check the list
    await page.goto('/my-bookings')
    await expect(page.getByRole('heading', { name: 'Le mie prenotazioni' })).toBeVisible()

    // Empty state must be gone
    await expect(page.getByText('Nessuna prenotazione')).not.toBeVisible({ timeout: 8_000 })
    // A booking card is visible
    await expect(page.locator('.rounded-lg.border.bg-card').first()).toBeVisible({ timeout: 8_000 })
  })

  test('each booking card shows a time range (HH:MM – HH:MM)', async ({ page }) => {
    await waitForSlotsLoaded(page)

    const prenotaBtn = await findFirstPrenotaButton(page)
    if (!prenotaBtn) {
      test.skip()
      return
    }

    await prenotaBtn.click()
    await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })

    await page.goto('/my-bookings')
    const card = page.locator('.rounded-lg.border.bg-card').first()
    await expect(card).toBeVisible({ timeout: 8_000 })
    await expect(card.getByText(/\d{2}:\d{2}\s*–\s*\d{2}:\d{2}/)).toBeVisible()
  })

  test('cancelling a booking via the trash icon removes it from the list', async ({ page }) => {
    // Create a booking
    await waitForSlotsLoaded(page)
    const prenotaBtn = await findFirstPrenotaButton(page)
    if (!prenotaBtn) {
      test.skip()
      return
    }

    await prenotaBtn.click()
    await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })

    // Navigate to my-bookings
    await page.goto('/my-bookings')
    await expect(page.locator('.rounded-lg.border.bg-card').first()).toBeVisible({ timeout: 8_000 })

    // Click the trash button (icon button in the booking card)
    const trashBtn = page.locator('.rounded-lg.border.bg-card button').first()
    await trashBtn.click()

    // Success toast
    await expect(page.getByText('Prenotazione cancellata.')).toBeVisible({ timeout: 8_000 })

    // Empty state is restored
    await expect(page.getByText('Nessuna prenotazione')).toBeVisible({ timeout: 8_000 })
  })

  test('bookings are listed in chronological ascending order', async ({ page }) => {
    await waitForSlotsLoaded(page)

    // Try to book on two consecutive dates
    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    let booked = 0

    for (let i = 0; i < 5 && booked < 2; i++) {
      await dateButtons.nth(i).click()
      await waitForSlotsLoaded(page)
      const btn = page.locator('main').getByRole('button', { name: 'Prenota', exact: true }).first()
      if ((await btn.count()) > 0) {
        await btn.click()
        await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })
        booked++
        // Navigate back to dashboard to book next
        await page.goto('/')
        await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible()
        await waitForSlotsLoaded(page)
      }
    }

    if (booked < 2) {
      test.skip()
      return
    }

    // Check ordering
    await page.goto('/my-bookings')
    await page.waitForTimeout(1_500) // allow list to render

    // Day numbers in the circular date badges
    const dayNums = await page
      .locator('.rounded-lg.border.bg-card span.text-xs.font-bold')
      .allTextContents()

    const nums = dayNums.map((d) => parseInt(d.trim())).filter((n) => !isNaN(n))
    expect(nums.length).toBeGreaterThanOrEqual(2)

    // Must be non-decreasing (same or later day each entry)
    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1])
    }
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function findFirstPrenotaButton(page: Page) {
  const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
  const dateCount = await dateButtons.count()
  if (dateCount === 0) return null

  for (let i = 0; i < dateCount; i++) {
    await dateButtons.nth(i).click()
    await waitForSlotsLoaded(page)
    const btn = page.locator('main').getByRole('button', { name: 'Prenota', exact: true }).first()
    if ((await btn.count()) > 0) return btn
  }
  return null
}
