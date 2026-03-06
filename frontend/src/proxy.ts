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
  console.error('[isPublicRoute]:', path);
  return PUBLIC_ROUTES.some((route) => {
    console.error('\t[route]:', route, '\t[path]:', path);
    return route === path || path.startsWith(route + '/')
});
}
function isAuthRoute(pathname: string) {
  const path = trimLocalePrefix(pathname);
  return AUTH_ROUTES.some((route) => route === path || path.startsWith(route + '/'));
}

export default async function middleware(request: NextRequest) {
  const response = i18nMiddleware(request);
  console.info('[middleware]:', response);
  console.error('[response.ok]:', response?.ok);
  // Return if next-intl middleware handled the request
  if (response && !response.ok)
    return response;

  const pathname = request.nextUrl.pathname;
  const local = pathname.split("/")[1] ?? "en";
  const session = getSessionCookie(request);

  console.info('[pathname]:', pathname);
  console.info('[local]:', local);
  console.info('[session]:', session);

  console.warn('[isPublicRoute]:', isPublicRoute(pathname));
  if (isPublicRoute(pathname)) {
    return response ?? NextResponse.next();
  }

  console.warn('[isAuthRoute]:', isAuthRoute(pathname));
  if (isAuthRoute(pathname)) {
    if (session) {
      return NextResponse.redirect(
        new URL(`/${local}/dashboard`, request.url),
        { headers: response?.headers },
      );
    }
    return response ?? NextResponse.next()
  }
  
  if (!session) {
    return NextResponse.redirect(
      new URL(`/${local}/login`, request.url),
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