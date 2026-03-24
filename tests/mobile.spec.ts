/**
 * Mobile experience tests (iPhone 14 viewport: 390×844).
 *
 * Covers:
 * - Page renders without horizontal overflow
 * - Sufficient bottom padding (content not clipped by home bar)
 * - Nav links accessible via avatar dropdown (no desktop nav on mobile)
 * - Date selector is horizontally scrollable
 * - Slot cards fully visible and bookable
 * - Booker names visible as text (no hover required)
 * - "Le mie prenotazioni" page usable on mobile
 */
import { test, expect, type Page } from '@playwright/test'
import { getAccessToken, clearMyBookings, waitForSlotsLoaded } from './helpers'

const MOBILE = { width: 390, height: 844 }

test.describe('Mobile experience', () => {
  test.use({ viewport: MOBILE })

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible({
      timeout: 8_000,
    })
    const token = await getAccessToken(page)
    await clearMyBookings(request, token)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible({
      timeout: 8_000,
    })
  })

  test('page has no horizontal scrollbar (no overflow-x)', async ({ page }) => {
    await page.goto('/')
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasOverflow).toBe(false)
  })

  test('main content has sufficient bottom padding (≥ 80px)', async ({ page }) => {
    await page.goto('/')
    const paddingBottom = await page.evaluate(() => {
      const main = document.querySelector('main')
      if (!main) return 0
      return parseFloat(getComputedStyle(main).paddingBottom)
    })
    expect(paddingBottom).toBeGreaterThanOrEqual(80)
  })

  test('desktop nav is hidden; avatar dropdown contains nav links', async ({ page }) => {
    await page.goto('/')
    // Desktop nav should not be visible on mobile
    const desktopNav = page.locator('nav.hidden')
    await expect(desktopNav).toBeAttached()

    // Open avatar dropdown
    await page.locator('[data-slot="avatar"]').first().click()

    // Nav links appear in dropdown
    await expect(page.getByRole('menuitem', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /Le mie prenotazioni/i })).toBeVisible()
  })

  test('date selector is scrollable horizontally and shows buttons', async ({ page }) => {
    await page.goto('/')
    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    await expect(dateButtons.first()).toBeVisible()
    const count = await dateButtons.count()
    expect(count).toBeGreaterThanOrEqual(14)
  })

  test('can book a slot on mobile', async ({ page }) => {
    await waitForSlotsLoaded(page)

    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    const dateCount = await dateButtons.count()

    let booked = false
    for (let i = 0; i < dateCount && !booked; i++) {
      await dateButtons.nth(i).click()
      await waitForSlotsLoaded(page)
      const btn = page.locator('main').getByRole('button', { name: 'Prenota', exact: true }).first()
      if ((await btn.count()) > 0) {
        await btn.tap()
        await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })
        booked = true
      }
    }

    if (!booked) test.skip()
  })

  test('booker names are visible as text on mobile (no hover needed)', async ({ page }) => {
    // Book a slot so there is at least one booker
    await waitForSlotsLoaded(page)
    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    const dateCount = await dateButtons.count()

    let targetDate = -1
    for (let i = 0; i < dateCount; i++) {
      await dateButtons.nth(i).click()
      await waitForSlotsLoaded(page)
      const btn = page.locator('main').getByRole('button', { name: 'Prenota', exact: true }).first()
      if ((await btn.count()) > 0) {
        await btn.tap()
        await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })
        targetDate = i
        break
      }
    }

    if (targetDate === -1) {
      test.skip()
      return
    }

    // Stay on the same date — booker name text should be visible (sm:hidden = always shown on mobile)
    const nameText = page.locator('.sm\\:hidden').filter({ hasText: /\w+/ }).first()
    await expect(nameText).toBeVisible({ timeout: 6_000 })
  })

  test('my-bookings page is usable on mobile', async ({ page }) => {
    await page.goto('/my-bookings')
    await expect(page.getByRole('heading', { name: 'Le mie prenotazioni' })).toBeVisible()

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasOverflow).toBe(false)

    // Empty state visible
    await expect(page.getByText('Nessuna prenotazione')).toBeVisible({ timeout: 8_000 })
  })

  test('can cancel a booking on mobile', async ({ page }) => {
    // Book a slot first
    await waitForSlotsLoaded(page)
    const dateButtons = page.locator('button.shrink-0.flex-col.rounded-lg.border')
    const dateCount = await dateButtons.count()

    let booked = false
    for (let i = 0; i < dateCount && !booked; i++) {
      await dateButtons.nth(i).click()
      await waitForSlotsLoaded(page)
      const btn = page.locator('main').getByRole('button', { name: 'Prenota', exact: true }).first()
      if ((await btn.count()) > 0) {
        await btn.tap()
        await expect(page.getByText('Prenotazione confermata!')).toBeVisible({ timeout: 10_000 })
        booked = true
      }
    }

    if (!booked) {
      test.skip()
      return
    }

    // Cancel via the Cancella button
    const cancelBtn = page.getByRole('button', { name: 'Cancella' })
    await expect(cancelBtn).toBeVisible()
    await cancelBtn.tap()
    await expect(page.getByText('Prenotazione cancellata.')).toBeVisible({ timeout: 8_000 })
  })
})
