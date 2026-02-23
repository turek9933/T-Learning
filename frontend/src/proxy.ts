import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { authClient } from './lib/auth-client';
import { getSessionCookie } from 'better-auth/cookies';

const i18nMiddleware = createMiddleware(routing);

const PROTECTED_ROUTES = [
  '/weronika',
  '/(auth)/register',
]
function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some((route) => pathname.match(new RegExp(`^/[a-z]{2}${route}`)));
}

export default async function middleware(request: NextRequest) {
  console.log('base url:', process.env.NEXT_PUBLIC_API_URL);

  const response = i18nMiddleware(request);

  console.log('request:', request);
  console.log('response:', response);

  // Return if next-intl middleware handled the request
  if (response && !response.ok)
    return response;

  if (isProtectedRoute(request.nextUrl.pathname)) {
    const session = getSessionCookie(request);

    console.log('session:', session);

    if (!session) {
      const locale = request.nextUrl.pathname.split("/")[1] ?? "en";
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  return response ?? NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};