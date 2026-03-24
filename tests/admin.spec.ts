/**
 * Admin area access-control tests.
 *
 * The real admin accounts (francesco.monti@humans.tech, emanuele.esposito@humans.tech)
 * use Google OAuth and cannot be authenticated programmatically in E2E tests.
 *
 * These tests verify:
 * - Unauthenticated access to /admin redirects to /login
 * - A regular authenticated user (test@humans.tech) is redirected away from /admin
 * - Admin link is NOT visible for regular users
 *
 * Full admin UI tests (stats, table, export) require manual testing with an admin account.
 */
import { test, expect } from '@playwright/test'

test.describe('Admin access control — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('unauthenticated /admin redirects to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('Admin access control — regular user (test@humans.tech)', () => {
  // test@humans.tech is NOT in the admins table

  test('Admin nav link is not shown for regular user', async ({ page }) => {
    await page.goto('/')
    // Wait for async isAdmin check
    await page.waitForTimeout(2_000)
    await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible()
  })

  test('/admin redirects regular user to dashboard', async ({ page }) => {
    await page.goto('/admin')
    // AdminGuard redirects to / for non-admins
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 8_000 })
    await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible({
      timeout: 8_000,
    })
  })

  test('cannot access admin stats or booking data', async ({ page }) => {
    await page.goto('/admin')
    // After redirect, we should be on dashboard, NOT the admin page
    await expect(page.getByRole('heading', { name: 'Area Admin' })).not.toBeVisible({
      timeout: 5_000,
    })
    await expect(page.getByText('Area Admin')).not.toBeVisible()
  })
})
