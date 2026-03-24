/**
 * Shared helpers for test setup and assertions.
 */
import type { Page, APIRequestContext } from '@playwright/test'

const SUPABASE_URL = 'https://idzyjfrqywugbzldqnox.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkenlqZnJxeXd1Z2J6bGRxbm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjk1NzcsImV4cCI6MjA4OTg0NTU3N30.2r4wlb3mxpvlIE_AHRZChL0RaCt0hCsr0UzcgjovisA'
const STORAGE_KEY = 'sb-idzyjfrqywugbzldqnox-auth-token'

/** Decode the payload of a JWT (base64url-encoded middle segment). */
function decodeJWT(token: string): { sub: string; [key: string]: unknown } {
  const payload = token.split('.')[1]
  // Add padding so atob / Buffer handles it correctly
  const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
  const decoded = Buffer.from(padded, 'base64').toString('utf-8')
  return JSON.parse(decoded)
}

/** Read the stored Supabase access token from the page's localStorage. */
export async function getAccessToken(page: Page): Promise<string> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
  if (!raw) throw new Error('No Supabase session found in localStorage')
  const session = JSON.parse(raw) as { access_token: string }
  return session.access_token
}

/**
 * Delete ALL bookings owned by the authenticated test user via Supabase REST API.
 * Decodes the JWT to extract user_id so the filter is reliable (no join needed).
 */
export async function clearMyBookings(request: APIRequestContext, accessToken: string) {
  const { sub: userId } = decodeJWT(accessToken)

  const res = await request.delete(
    `${SUPABASE_URL}/rest/v1/bookings?user_id=eq.${userId}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal',
      },
    }
  )
  // Non-2xx is not fatal for cleanup — swallow silently
  if (!res.ok()) {
    console.warn(`clearMyBookings: DELETE returned ${res.status()}`)
  }
}

/**
 * Wait for the dashboard slots section to finish loading.
 * Waits until skeleton loaders (animate-pulse) inside <main> disappear,
 * or a slot card / empty-day message appears.
 */
export async function waitForSlotsLoaded(page: Page) {
  await page.waitForFunction(
    () => {
      const main = document.querySelector('main')
      if (!main) return false
      // Still loading if any animated skeletons are visible
      const skeletons = main.querySelectorAll('[class*="animate-pulse"]')
      if (skeletons.length > 0) return false
      // Loaded when we see a slot card OR the empty-day message OR the error state
      const hasCards = main.querySelectorAll('.rounded-lg.border.bg-card.p-4').length > 0
      const hasEmpty = main.querySelector('.rounded-lg.border.border-dashed') !== null
      return hasCards || hasEmpty
    },
    { timeout: 12_000 }
  )
}

/** Returns the next N weekday dates as YYYY-MM-DD strings (local timezone). */
export function getNextWeekdays(count: number): string[] {
  const days: string[] = []
  const d = new Date()
  // Work with local midnight
  d.setHours(0, 0, 0, 0)

  while (days.length < count) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      // Format using local date components to avoid UTC offset drift
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      days.push(`${yyyy}-${mm}-${dd}`)
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}
