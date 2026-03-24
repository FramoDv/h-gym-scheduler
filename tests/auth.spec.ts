/**
 * Authentication flow tests.
 *
 * Covers:
 * - Unauthenticated users are redirected to /login
 * - Login page shows only Google OAuth (no email/password form)
 * - Branding is correct
 * - Authenticated users see the dashboard
 */
import { test, expect } from '@playwright/test'

// ── Unauthenticated ───────────────────────────────────────────────────────────

test.describe('Login page — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('redirects / to /login when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('redirects /my-bookings to /login when not authenticated', async ({ page }) => {
    await page.goto('/my-bookings')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('redirects /admin to /login when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('shows Google OAuth button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /accedi con google/i })).toBeVisible()
  })

  test('does NOT show email input field', async ({ page }) => {
    await page.goto('/login')
    // Email auth was removed — no input[type=email] should exist
    await expect(page.locator('input[type="email"]')).not.toBeVisible()
  })

  test('does NOT show password input field', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="password"]')).not.toBeVisible()
  })

  test('shows HumansGym brand on login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('HumansGym')).toBeVisible()
  })
})

// ── Authenticated regular user (test@humans.tech) ─────────────────────────────

test.describe('Authenticated user', () => {
  // Uses storageState from playwright.config.ts (tests/.auth/user.json)

  test('stays on dashboard after navigating to /', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('shows HumansGym brand in header', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /humansgym/i }).first()).toBeVisible()
  })

  test('shows Dashboard and "Le mie prenotazioni" nav links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Le mie prenotazioni' })).toBeVisible()
  })

  test('Admin nav link is NOT visible for regular user', async ({ page }) => {
    await page.goto('/')
    // test@humans.tech is not in the admins table — admin link must not appear
    // Wait a moment for the async isAdmin check to complete
    await page.waitForTimeout(2_000)
    await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible()
  })

  test('/admin redirects regular user back to /', async ({ page }) => {
    await page.goto('/admin')
    // AdminGuard redirects non-admin to /
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 8_000 })
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible({
      timeout: 8_000,
    })
  })
})
