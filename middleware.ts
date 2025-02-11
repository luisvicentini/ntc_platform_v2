import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que não precisam de autenticação
const publicRoutes = [
  '/auth/member',
  '/auth/business',
  '/auth/partner',
  '/auth/master',
  '/auth/register'
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

  // Permite acesso a recursos estáticos e API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Permite acesso a todas as rotas da aplicação
  // O RouteGuard cuidará da proteção no client-side
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)'
  ]
}
