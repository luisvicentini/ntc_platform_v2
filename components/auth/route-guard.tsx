"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { UserType } from "@/contexts/auth-context"

interface RouteGuardProps {
  children: React.ReactNode
  allowedUserType: UserType
}

export function RouteGuard({ children, allowedUserType }: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(user)

  useEffect(() => {
    // Verifica o localStorage apenas no cliente
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('authUser')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setAuthenticatedUser(user || parsedUser)
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('authUser')
        }
      }
    }
  }, [user])

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const handleRouting = async () => {
      // Se estiver carregando, aguarda
      if (loading) {
        console.log('RouteGuard - Carregando...')
        return
      }

      // Se estiver em processo de autenticação, aguarda
      if (isAuthenticating) {
        console.log('RouteGuard - Em processo de autenticação...')
        return
      }

      console.log('RouteGuard - Estado atual:', { 
        user, 
        authenticatedUser,
        loading, 
        allowedUserType,
        currentPath: window.location.pathname,
        isAuthenticating
      })

      // Se estiver na rota de login ou registro
      const isAuthRoute = window.location.pathname.startsWith('/auth/')
      if (isAuthRoute) {
        if (authenticatedUser) {
          // Se já estiver autenticado, redireciona para a área correta
          console.log('RouteGuard - Usuário autenticado em rota de auth, redirecionando...')
          const redirectPath = authenticatedUser.userType === "member" ? "/member/feed" : `/${authenticatedUser.userType}/dashboard`
          if (mounted) {
            await new Promise(resolve => setTimeout(resolve, 500))
            window.location.href = redirectPath
          }
        } else {
          console.log('RouteGuard - Em rota de autenticação, permitindo acesso')
        }
        return
      }

      // Se não estiver autenticado em uma rota protegida
      if (!authenticatedUser) {
        console.log('RouteGuard - Usuário não autenticado, redirecionando para login...')
        if (mounted) {
          setIsAuthenticating(true)
          await new Promise(resolve => setTimeout(resolve, 500))
          window.location.href = `/auth/${allowedUserType}`
        }
        return
      }

      // Se estiver autenticado mas com tipo incorreto
      if (authenticatedUser.userType !== allowedUserType) {
        console.log('RouteGuard - Tipo de usuário incorreto, redirecionando...')
        if (mounted) {
          const redirectPath = authenticatedUser.userType === "member" ? "/member/feed" : `/${authenticatedUser.userType}/dashboard`
          console.log('RouteGuard - Redirecionando para:', redirectPath)
          await new Promise(resolve => setTimeout(resolve, 500))
          window.location.href = redirectPath
        }
        return
      }

      // Se chegou aqui, o acesso está permitido
      console.log('RouteGuard - Acesso permitido para:', authenticatedUser.userType)
      setIsAuthenticating(false)
    }

    // Adiciona um pequeno delay antes de verificar o estado
    timeoutId = setTimeout(handleRouting, 1000)

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [user, loading, allowedUserType, isAuthenticating, authenticatedUser])

  // Mostra indicador de carregamento enquanto verifica a autenticação
  if (loading || !authenticatedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ntc-purple"></div>
      </div>
    )
  }

  // Se o usuário está autenticado e tem o tipo correto, mostra o conteúdo
  if (authenticatedUser && authenticatedUser.userType === allowedUserType) {
    return <>{children}</>
  }

  // Caso contrário, mostra o loading ou nada
  if (loading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ntc-purple"></div>
      </div>
    )
  }

  return null
}
