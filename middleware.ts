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
  '/stories'
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
      '/api/lastlink/callback',
      '/api/auth/session',
    ]

    // Verificar se é uma rota pública
    if (publicApiRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
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
