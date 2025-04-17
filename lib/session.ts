import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from './constants'

const SESSION_DURATION_SECONDS = 60 * 60

export function checkMigrationLimit(request: NextRequest): boolean {
  // Directly return false to disable the limit check for testing
  console.log('DEBUG: Migration limit check bypassed (always returning false)')
  return false
}

export function setMigrationCookie(response: NextResponse): void {
  // This function still sets the cookie, but the check above ignores it.
  // If you also wanted to prevent setting the cookie during testing,
  // you would need additional logic here (like checking an env var).
  const cookieStore = cookies()
  const expires = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000)

  cookieStore.set(SESSION_COOKIE_NAME, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expires,
  })
  console.log('Migration limit cookie set (check is currently disabled).')
}