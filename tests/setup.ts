/**
 * Auth setup: signs in test@humans.tech via Supabase REST API and saves
 * the browser storage state so that all subsequent tests start authenticated.
 */
import { test as setup, expect } from '@playwright/test'

const AUTH_FILE = 'tests/.auth/user.json'

const SUPABASE_URL = 'https://idzyjfrqywugbzldqnox.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkenlqZnJxeXd1Z2J6bGRxbm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjk1NzcsImV4cCI6MjA4OTg0NTU3N30.2r4wlb3mxpvlIE_AHRZChL0RaCt0hCsr0UzcgjovisA'
const STORAGE_KEY = 'sb-idzyjfrqywugbzldqnox-auth-token'

setup('authenticate as test user', async ({ page }) => {
  // Obtain a Supabase session via the password grant
  const res = await page.request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        email: 'test@humans.tech',
        password: 'Test1234!',
      },
    }
  )

  expect(res.ok(), `Auth API returned ${res.status()}: ${await res.text()}`).toBeTruthy()
  const session = await res.json()
  expect(session.access_token).toBeTruthy()

  // Navigate to the app so we can write to its localStorage origin
  await page.goto('/')

  // Inject the session – supabase-js reads this key on startup
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
    [STORAGE_KEY, session] as [string, unknown]
  )

  // Reload so the app picks up the session and redirects away from /login
  await page.goto('/')

  // The dashboard should be visible
  await expect(page.getByRole('heading', { name: 'Prenota uno slot' })).toBeVisible({
    timeout: 10_000,
  })

  // Persist cookies + localStorage for all downstream tests
  await page.context().storageState({ path: AUTH_FILE })
})
