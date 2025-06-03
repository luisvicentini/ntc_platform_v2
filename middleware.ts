import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que não precisam de autenticação
const publicRoutes = [
  '/auth/register',
  '/checkout-redirect',
  '/login',
  '/mc',
  '/wp',
  '/email',
  '/bio',
  '/stories',
  '/success',
  '/lastlink-success',
  '/auth/activate-account',
  '/vendas'
]

// Mapeia os tipos de usuário para suas rotas permitidas
const userTypeRoutes = {
  member: ['/member'],
  business: ['/business'],
  partner: ['/partner'],
  master: ['/master']
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Adicionar cabeçalhos CORS para acessar Firebase Storage
  if (pathname.includes('firebasestorage')) {
    return NextResponse.next({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  // Permite acesso a recursos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Proteger rotas de API
  if (pathname.startsWith('/api')) {
    // Permitir rotas públicas de API
    const publicApiRoutes = [
      '/api/users/activate',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/payment/direct-session',
      '/api/stripe/webhook',
      '/api/stripe/sync-subscription',
      '/api/lastlink/webhook',
      '/api/lastlink/webhook-create-user',
      '/api/lastlink/callback',
      '/api/lastlink/redirect',
      '/api/auth/session',
      '/api/account-activation/verify',
      '/api/account-activation/set-password',
      '/api/public/restaurants',
      '/api/stories',
      '/api/stories/create',
      '/api/proxy/video',
      '/api/products'
    ]

    // Verificar se é uma rota pública
    const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));
    
    // Adicionar log para depuração
    if (pathname.includes('/public/restaurants') || pathname.includes('/stories') || pathname.includes('/products')) {
      console.log(`[MIDDLEWARE] Acesso detectado à rota: ${pathname}`);
      console.log(`[MIDDLEWARE] É uma rota pública? ${isPublicApiRoute ? 'SIM' : 'NÃO'}`);
      console.log(`[MIDDLEWARE] Ação: ${isPublicApiRoute ? 'Permitir acesso' : 'Verificar autenticação'}`);
      console.log(`[MIDDLEWARE] Headers:`, {
        host: request.headers.get('host'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      });
      
      // Verificar se há sessão
      const hasSession = request.cookies.has('__session');
      console.log(`[MIDDLEWARE] Sessão existe? ${hasSession ? 'SIM' : 'NÃO'}`);
    }
    
    // Lidar com requisições OPTIONS para CORS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    if (isPublicApiRoute) {
      console.log(`[MIDDLEWARE] Permitindo acesso à rota pública: ${pathname}`);
      return NextResponse.next();
    }

    // Verificar se é uma rota de autenticação
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next()
    }

    const session = request.cookies.get('__session')
    
    // Se não houver sessão, retornar erro
    if (!session?.value) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      )
    }

    // Adicionar o token da sessão no header para as rotas de API
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-session-token', session.value)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Verificar se é uma rota pública
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Permite acesso a todas as outras rotas da aplicação
  // O RouteGuard cuidará da proteção no client-side
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     * - success page
     * - api/users/resend-activation
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|success|api/users/resend-activation|bg-ntc.jpg).*)',
    '/api/:path*'
  ]
}
