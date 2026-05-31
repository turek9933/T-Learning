import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const i18nMiddleware = createMiddleware(routing);

// By default all routes are protected, except for PUBLIC_ROUTES
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/privacy-policy',
  '/terms',
  '/favicon.ico',
  '/contact',
  '/verify-email',
  '/offline',
]
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

const localePrefix = /^\/[a-z]{2}/;
function trimLocalePrefix(pathname: string) {
  return pathname.replace(localePrefix, '') || '/';
}

function isPublicRoute(pathname: string) {
  const path = trimLocalePrefix(pathname);
  return PUBLIC_ROUTES.some((route) => {
    return route === path || path.startsWith(route + '/')
});
}
function isAuthRoute(pathname: string) {
  const path = trimLocalePrefix(pathname);
  return AUTH_ROUTES.some((route) => route === path || path.startsWith(route + '/'));
}

// Check if signed session cookie is present
// Cookies are refreshed on every API call
// Expired or incorrect cookies pass middleware,
// but fail the first API call and log out the user.
function hasSessionCookie(request: NextRequest) {
  return !!getSessionCookie(request);
}

export default async function middleware(request: NextRequest) {
  const response = i18nMiddleware(request);

  // Return if next-intl middleware handled the request
  if (response && response.status !== 200)
    return response;

  const pathname = request.nextUrl.pathname;
  const local = pathname.split("/")[1] ?? "en";

  if (isPublicRoute(pathname))
    return response ?? NextResponse.next();

  const hasSession = hasSessionCookie(request);

  if (isAuthRoute(pathname)) {
    if (hasSession) {
      return NextResponse.redirect(
        new URL(`/${local}/dashboard`, request.url),
        { headers: response?.headers },
      );
    }
    return response ?? NextResponse.next()
  }

  if (!hasSession) {
    const loginUrl = new URL(`/${local}/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(
      loginUrl,
      { headers: response?.headers },
    );
  }

  return response ?? NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};