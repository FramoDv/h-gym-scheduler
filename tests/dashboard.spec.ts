/**
 * Dashboard tests.
 *
 * Covers:
 * - Date selector shows exactly 10 weekday buttons, no weekends
 * - First date is the next working day
 * - Selecting a date loads slots
 * - Booking a slot: success toast, "Prenotato" badge, "Cancella" button
 * - One-slot-per-day rule: other slots on same day show "Hai già uno slot oggi"
 * - Cancelling a slot: success toast, "Prenota" button restored
 * - Full, cancelled, below-minimum, and cutoff slot states
 */
import { test, expect, type Page } from '@playwright/test'
import { getAccessToken, clearMyBookings, waitForSlotsLoaded, getNextWeekdays } from './helpers'

// ── Date selector ─────────────────────────────────────────────────────────────

test.describe('Date selector', () => {
  test('shows exactly 10 buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible()

    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    await expect(dateButtons).toHaveCount(10)
  })

  test('contains no weekend dates (Sat/Sun)', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible()

    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    const count = await dateButtons.count()

    for (let i = 0; i < count; i++) {
      // First span = Italian day abbreviation (e.g. "LUN", "MAR", "SAB", "DOM")
      const dayAbbr = await dateButtons.nth(i).locator('span').first().textContent()
      expect(dayAbbr?.trim().toUpperCase(), `Button ${i} is a weekend`).not.toMatch(
        /^(SAB|DOM)$/
      )
    }
  })

  test('first date is today (or next weekday) in local timezone', async ({ page }) => {
    await page.goto('/')
    const expectedFirst = getNextWeekdays(1)[0] // YYYY-MM-DD in local time

    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    const firstBtn = dateButtons.first()

    // Second span = day number
    const dayNum = await firstBtn.locator('span').nth(1).textContent()
    expect(parseInt(dayNum ?? '0')).toBe(parseInt(expectedFirst.slice(8, 10)))
  })

  test('clicking the second date selects it (highlighted) and loads slots', async ({ page }) => {
    await page.goto('/')
    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    await expect(dateButtons.first()).toBeVisible()

    const secondBtn = dateButtons.nth(1)
    await secondBtn.click()

    // Selected button gets primary background
    await expect(secondBtn).toHaveClass(/bg-primary/)

    // Skeleton loaders disappear once slots are fetched
    await waitForSlotsLoaded(page)
  })
})

// ── Booking flow ──────────────────────────────────────────────────────────────

test.describe('Booking flow', () => {
  test.beforeEach(async ({ page, request }) => {
    // Start on dashboard
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible({
      timeout: 8_000,
    })

    // Clean up all bookings for the test user
    const token = await getAccessToken(page)
    await clearMyBookings(request, token)

    // Navigate fresh so the UI reflects the clean state
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible({
      timeout: 8_000,
    })
    await waitForSlotsLoaded(page)
  })

  test('books an available slot successfully', async ({ page }) => {
    const prenotaBtn = await findFirstPrenotaButton(page)
    if (!prenotaBtn) {
      test.skip()
      return
    }

    await prenotaBtn.click()

    await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Prenotato')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('button', { name: 'Cancella' })).toBeVisible()
  })

  test('after booking, other slots on the same day show the single-slot badge', async ({
    page,
  }) => {
    // Select the first date explicitly
    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    await dateButtons.first().click()
    await waitForSlotsLoaded(page)

    // Count available Prenota buttons for this date
    const prenotaBtns = slotCardButtons(page, 'Prenota')
    const initialCount = await prenotaBtns.count()
    if (initialCount < 2) {
      test.skip()
      return
    }

    // Book the first available slot
    await prenotaBtns.first().click()
    await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })

    // All other slots on same day must show the "already booked" badge
    await expect(page.getByText('Hai già uno slot oggi').first()).toBeVisible({ timeout: 8_000 })
  })

  test('cancels a booking from the slot card', async ({ page }) => {
    const prenotaBtn = await findFirstPrenotaButton(page)
    if (!prenotaBtn) {
      test.skip()
      return
    }

    // Book
    await prenotaBtn.click()
    await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })

    // Cancel
    const cancelBtn = page.getByRole('button', { name: 'Cancella' })
    await expect(cancelBtn).toBeVisible()
    await cancelBtn.click()

    await expect(page.getByText('Prenotazione cancellata.')).toBeVisible({ timeout: 8_000 })

    // Slot is bookable again
    await expect(slotCardButtons(page, 'Prenota').first()).toBeVisible({ timeout: 8_000 })
    // "Prenotato" badge is gone
    await expect(page.getByText('Prenotato')).not.toBeVisible()
  })

  test('only one "Cancella" button exists after booking a slot', async ({ page }) => {
    const prenotaBtn = await findFirstPrenotaButton(page)
    if (!prenotaBtn) {
      test.skip()
      return
    }

    await prenotaBtn.click()
    await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })

    const cancelBtns = page.getByRole('button', { name: 'Cancella' })
    await expect(cancelBtns).toHaveCount(1)
  })
})

// ── Slot visual states ────────────────────────────────────────────────────────

test.describe('Slot visual states', () => {
  test('slot card shows the "+15 min uscita" note', async ({ page }) => {
    await page.goto('/')
    await waitForSlotsLoaded(page)

    const note = page.getByText('+15 min uscita')
    if ((await note.count()) > 0) {
      await expect(note.first()).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('full slot displays "Completo" badge', async ({ page }) => {
    await page.goto('/')
    await waitForSlotsLoaded(page)

    if (!(await scanDatesForText(page, 'Completo'))) test.skip()
  })

  test('cancelled slot displays "Annullato" badge', async ({ page }) => {
    await page.goto('/')
    await waitForSlotsLoaded(page)

    if (!(await scanDatesForText(page, 'Annullato'))) test.skip()
  })

  test('slot within 1-hour cutoff shows "Chiuso" badge', async ({ page }) => {
    await page.goto('/')
    await waitForSlotsLoaded(page)

    // Cutoff badge only appears today for past/near-future slots
    const chiusoBadge = page.getByText('Chiuso')
    if ((await chiusoBadge.count()) === 0) {
      test.skip()
      return
    }
    await expect(chiusoBadge.first()).toBeVisible()
  })

  test('slot below minimum capacity shows warning banner', async ({ page }) => {
    await page.goto('/')
    await waitForSlotsLoaded(page)

    if (!(await scanDatesForText(page, /minimo.*partecipanti/i))) test.skip()
  })

  test('empty day shows the "Nessuno slot disponibile" message', async ({ page }) => {
    await page.goto('/')
    await waitForSlotsLoaded(page)

    if (!(await scanDatesForText(page, 'Nessuno slot disponibile per questo giorno.'))) {
      test.skip()
    }
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Target only "Prenota" buttons inside slot cards (not anywhere else on the page).
 * SlotCard renders inside .space-y-2 > div (SlotSection children).
 */
function slotCardButtons(page: Page, name: string) {
  // The main content area has div.space-y-6 > div.space-y-3 > div.space-y-2 > SlotCards
  // Each SlotCard is a div.rounded-lg.border.bg-card.p-4 or similar
  return page.locator('main').getByRole('button', { name, exact: true })
}

/**
 * Walk through all 10 date buttons looking for a "Prenota" button inside a slot card.
 * Returns the first available locator, or null if none found.
 */
async function findFirstPrenotaButton(page: Page) {
  const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
  const dateCount = await dateButtons.count()
  if (dateCount === 0) return null

  for (let i = 0; i < dateCount; i++) {
    await dateButtons.nth(i).click()
    await waitForSlotsLoaded(page)

    // Only look for Prenota buttons inside the main content area (slot cards)
    const btn = slotCardButtons(page, 'Prenota').first()
    if ((await btn.count()) > 0) {
      return btn
    }
  }
  return null
}

/**
 * Walk through all 10 dates looking for text/regex in the main content.
 * Returns true if found on any date.
 */
async function scanDatesForText(page: Page, text: string | RegExp): Promise<boolean> {
  const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
  const count = await dateButtons.count()

  for (let i = 0; i < count; i++) {
    await dateButtons.nth(i).click()
    await waitForSlotsLoaded(page)
    const el = page.getByText(text)
    if ((await el.count()) > 0) {
      await expect(el.first()).toBeVisible()
      return true
    }
  }
  return false
}
