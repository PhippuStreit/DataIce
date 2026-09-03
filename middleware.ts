import { NextRequest, NextResponse } from 'next/server';

// Basic-Auth für die Auswertungsseite. Nur aktiv, wenn ANALYTICS_PASSWORD gesetzt ist.
export function middleware(request: NextRequest) {
  const password = process.env.ANALYTICS_PASSWORD;
  if (!password) return NextResponse.next();

  const user = process.env.ANALYTICS_USER || 'nexplore';
  const header = request.headers.get('authorization') || '';

  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const idx = decoded.indexOf(':');
      const gotUser = decoded.slice(0, idx);
      const gotPass = decoded.slice(idx + 1);
      if (gotUser === user && gotPass === password) {
        return NextResponse.next();
      }
    } catch {
      // fällt unten durch
    }
  }

  return new NextResponse('Authentifizierung erforderlich.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Auswertung", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ['/auswertung/:path*'],
};
