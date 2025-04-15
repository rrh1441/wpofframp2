// lib/session.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './constants';

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
// More restrictive for MVP: Limit to 1 hour to allow re-testing
const SESSION_DURATION_SECONDS = 60 * 60;

/**
 * Checks if the user associated with the request has already performed a migration
 * based on the presence and value of a specific cookie.
 */
export function checkMigrationLimit(request: NextRequest): boolean {
  const cookieStore = cookies(); // Use next/headers cookies
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  // console.log('Checking migration limit. Cookie:', sessionCookie); // Debug log

  // Check if the cookie exists and its value indicates a migration has occurred
  return !!sessionCookie && sessionCookie.value === 'true';
}

/**
 * Sets a cookie on the response to mark that a migration has been performed
 * for the current session.
 */
export function setMigrationCookie(response: NextResponse): void {
  const cookieStore = cookies(); // Use next/headers cookies
  const expires = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  // console.log('Setting migration cookie. Expires:', expires); // Debug log

  // Note: In Next.js App Router API routes, you modify the response object directly.
  // The `cookies().set()` method handles adding the 'Set-Cookie' header to the response.
  cookieStore.set(SESSION_COOKIE_NAME, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax', // Lax is generally a good default
    path: '/', // Make cookie available site-wide
    expires: expires,
    // maxAge: SESSION_DURATION_SECONDS, // Alternative to expires
  });
}

// Example Usage in API Route:
// import { checkMigrationLimit, setMigrationCookie } from '@/lib/session';
// import { NextRequest, NextResponse } from 'next/server';
//
// export async function POST(request: NextRequest) {
//   if (checkMigrationLimit(request)) {
//     return NextResponse.json({ error: 'Migration limit reached for this session.' }, { status: 429 });
//   }
//
//   // ... perform migration logic ...
//
//   // If migration is successful:
//   const response = NextResponse.json({ success: true /*, zip data */ });
//   setMigrationCookie(response);
//   return response;
// }