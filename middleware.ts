// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Generate the CSP policy
  const cspPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "img-src 'self' data: blob: https://i.scdn.co https://mosaic.scdn.co https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.googleusercontent.com https://picsum.photos https://i.ytimg.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://cdn.osxdaily.com https://*.imgcdn.dev https://s6.imgcdn.dev https://cdn.danielcabrera.es https://yt3.ggpht.com https://www.googletagmanager.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", 
    `script-src 'self' 'strict-dynamic' 'nonce-${nonce}'${!isProd ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com`,
    "connect-src 'self' https://api.spotify.com https://accounts.spotify.com https://api.open-meteo.com https://geocoding-api.open-meteo.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://api.thenewsapi.com",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com data: blob:",
    "form-action 'self'",
    "report-uri /api/security/csp-report",
    isProd ? "upgrade-insecure-requests" : "",
  ].filter(Boolean).join("; ");

  // 2. Inject nonce into request headers for layout.tsx to consume
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // 3. Create the response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 4. Set CSP on the response headers
  response.headers.set("Content-Security-Policy", cspPolicy);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
