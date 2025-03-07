"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirecionar com base no tipo de usuário
        switch (user.userType) {
          case 'member':
            router.push('/member/profile')
            break
          case 'partner':
            router.push('/partner/dashboard')
            break
          case 'business':
            router.push('/business/dashboard')
            break
          case 'master':
            router.push('/master/dashboard')
            break
        }
      } else {
        // Se não estiver autenticado, redirecionar para a página de login
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7435db]"></div>
    </div>
  )
}

