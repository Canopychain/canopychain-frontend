import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Plain conditional logic rather than next.config.ts's headers()
 * path-matching, for consistency with how this is done elsewhere and
 * because every route gets the same treatment here — no path-specific
 * exemptions to express.
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

export const config = {
  matcher: '/:path*',
};
