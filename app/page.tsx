"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Benefits from "@/components/homepage/benefits"
import Hero from "@/components/homepage/hero"
import Restaurants from "@/components/homepage/restaurants"
import About from "@/components/homepage/about"
import Footer from "@/components/homepage/footer"

export default function HomePage() {
  // const { user, loading } = useAuth()
  // const router = useRouter()

  // useEffect(() => {
  //   if (!loading) {
  //     if (user) {
  //       // Redirecionar com base no tipo de usuário
  //       switch (user.userType) {
  //         case 'member':
  //           router.push('/member/feed')
  //           break
  //         case 'partner':
  //           router.push('/partner/dashboard')
  //           break
  //         case 'business':
  //           router.push('/business/dashboard')
  //           break
  //         case 'master':
  //           router.push('/master/dashboard')
  //           break
  //       }
  //     } else {
  //       // Se não estiver autenticado, redirecionar para a página de login
  //       router.push('/login')
  //     }
  //   }
  // }, [user, loading, router])

  return (
    <main className="bg-[#1A1A1A] min-h-screen text-white overflow-hidden">
      <Hero />
      <Benefits />
      <Restaurants />
      <About />
      <Footer />
    </main>
  )
}

