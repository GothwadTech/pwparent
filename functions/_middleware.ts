/**
 * Pages Functions middleware — runs before every route.
 * Only touches /api/*, so static SPA assets and the /* -> index.html rewrite
 * in public/_redirects keep working exactly as before.
 */

interface MiddlewareEnv {
  ALLOWED_ORIGIN?: string;
}

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
  env: MiddlewareEnv;
}) {
  const {request, next, env} = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/api/')) return next();

  // Health probe, handy for the deploy workflow / uptime checks.
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ok: true, time: new Date().toISOString()}), {
      headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'},
    });
  }

  const origin = request.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGIN ?? '';
  const isAllowed =
    origin.endsWith('.pages.dev') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    (allowed && origin === allowed);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      },
    });
  }

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', isAllowed ? origin : '');
  headers.set('Vary', 'Origin');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cache-Control', 'no-store');
  return new Response(response.body, {...response, headers});
}
