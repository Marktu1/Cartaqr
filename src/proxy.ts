// Corre antes de cada pedido (no Next 16 o "middleware" chama-se "proxy").
//  1. Força HTTPS em produção.
//  2. Content-Security-Policy com nonce por pedido: só correm os scripts da própria app.
//  3. Bloqueia pedidos à API que alteram dados vindos de outros sites (CSRF).
import { NextResponse, type NextRequest } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

function csp(nonce: string, https: boolean) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? '' : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProd && https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export function proxy(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';

  // 1. HTTPS obrigatório (o Render, como a maioria dos proxies, indica o protocolo original neste cabeçalho)
  if (isProd && req.headers.get('x-forwarded-proto') === 'http' && !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
    const url = req.nextUrl.clone(); url.protocol = 'https:'; url.host = req.headers.get('host') || host; url.port = '';
    return NextResponse.redirect(url, 308);
  }

  // 3. Pedidos que alteram dados só podem vir do próprio site
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.headers.get('origin');
    if (origin) {
      let originHost = '';
      try { originHost = new URL(origin).host; } catch { /* inválido */ }
      if (originHost !== host) return NextResponse.json({ ok: false, error: 'Pedido não permitido.', code: 'forbidden_origin' }, { status: 403 });
    } else if (req.headers.get('sec-fetch-site') === 'cross-site') {
      return NextResponse.json({ ok: false, error: 'Pedido não permitido.', code: 'forbidden_origin' }, { status: 403 });
    }
  }
  if (pathname.startsWith('/api/')) return NextResponse.next();

  // 2. CSP com nonce para as páginas
  const nonce = btoa(crypto.randomUUID());
  const policy = csp(nonce, req.headers.get('x-forwarded-proto') === 'https');
  const headers = new Headers(req.headers);
  headers.set('x-nonce', nonce);
  headers.set('content-security-policy', policy);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('Content-Security-Policy', policy);
  return res;
}

export const config = {
  matcher: [
    // tudo exceto ficheiros estáticos
    { source: '/((?!_next/static|_next/image|fonts/|favicon|icon|apple-icon|logo-|robots.txt|sitemap.xml).*)' },
  ],
};
