"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Benefits from "@/components/vendas/benefits"
import Hero from "@/components/vendas/hero"
import Restaurants from "@/components/vendas/restaurants"
import About from "@/components/vendas/about"
import Footer from "@/components/vendas/footer"
import Bonus from "@/components/vendas/bonus-section"
import RestaurantsSection from "@/components/vendas/restaurants-section"
import Countdown from "@/components/vendas/countdown"
import SavingsCalculator from "@/components/vendas/savings-calculator"
import PlansSection from "@/components/vendas/plans-section"
import HowItWorks from "@/components/vendas/how-it-works"
import FAQSection from "@/components/vendas/faq-section"


export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user !== null) {
      if (user) {
        // Redirecionar com base no tipo de usuário
        switch (user.userType) {
          case 'member':
            router.push('/member/feed')
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
    <div className="bg-black text-white overflow-hidden">
      {/* Topbar com countdown */}
      <Countdown initialMinutes={14} initialSeconds={0} />
      
      {/* Hero section com vídeo */}
      <Hero />
      
      {/* Seção de benefícios (modificada para carrossel) */}
      <Benefits isCarousel={true} />
      
      
      {/* Nova seção de restaurantes */}
      <Suspense 
        fallback={
          <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#F24957]"></div>
        </div>}
      >
        <RestaurantsSection />
      </Suspense>
      
      {/* Restaurantes */}
      <Restaurants />
      
      {/* Seção de bônus */}
      {/* <Bonus /> */}
      
      {/* Calculadora de Economia */}
      <SavingsCalculator />
      
      {/* Seção de planos e ofertas */}
      <Suspense 
        fallback={
          <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#F24957]"></div>
        </div>}
      >
        <PlansSection />
      </Suspense>
      
      <Suspense 
        fallback={
          <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#F24957]"></div>
        </div>}
      >
        <HowItWorks />
      </Suspense>
      
      {/* FAQ */}
      <FAQSection />
      
      {/* Sobre */}
      <About />
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

