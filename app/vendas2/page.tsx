"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Benefits from "@/components/vendas/benefits"
import Hero from "@/components/vendas/hero"
import Restaurants from "@/components/vendas/restaurants"
import About from "@/components/vendas/about"
import Footer from "@/components/vendas/footer"
import RestaurantsSection from "@/components/vendas/restaurants-section"
import SavingsCalculator from "@/components/vendas/savings-calculator"
import PlansSection from "@/components/vendas/plans-section"
import FAQSection from "@/components/vendas/faq-section"
import Topbar from "@/components/vendas/topbar"
import { X } from "lucide-react"
import TopRestaurants from "@/components/vendas/top-restaurants"


export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [isRestaurantsModalOpen, setIsRestaurantsModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);

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
  

  const openRestaurantsModal = () => setIsRestaurantsModalOpen(true);
  const closeRestaurantsModal = () => setIsRestaurantsModalOpen(false);

  const openCalculatorModal = () => setIsCalculatorModalOpen(true);
  const closeCalculatorModal = () => setIsCalculatorModalOpen(false);

  // Bloquear scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isRestaurantsModalOpen || isCalculatorModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isRestaurantsModalOpen, isCalculatorModalOpen]);

  return (
    <div className="bg-white text-white overflow-hidden">
      {/* Topbar com countdown */}
      <Topbar 
        openRestaurantsModal={openRestaurantsModal}
        openCalculatorModal={openCalculatorModal}
      />
      
      {/* Hero section com vídeo */}
      <Hero showPriceBlock={false} />

      {/* Restaurantes */}
      <TopRestaurants />
      
      {/* Seção de benefícios (modificada para carrossel) */}
      <Benefits isCarousel={true} />
      
      {/* Restaurantes */}
      <Restaurants />
      
      {/* Seção de planos e ofertas */}
      <Suspense 
        fallback={
          <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#F24957]"></div>
        </div>}
      >
        <PlansSection />
      </Suspense>
      
      {/* FAQ */}
      <FAQSection />
      
      {/* Sobre */}
      <About />
      
      {/* Footer */}
      <Footer />

      {/* Modal para RestaurantsSection */}
      {isRestaurantsModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2">
          <div className="bg-white text-black rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0 relative">
            <button 
              onClick={closeRestaurantsModal} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Fechar modal de restaurantes"
            >
              <X size={24} />
            </button>
            <Suspense 
              fallback={
                <div className="h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#F24957]"></div>
              </div>}
            >
              <RestaurantsSection />
            </Suspense>
          </div>
        </div>
      )}

      {/* Modal para SavingsCalculator */}
      {isCalculatorModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2">
          <div className="bg-white text-black rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-2 relative">
            <button 
              onClick={closeCalculatorModal} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Fechar modal da calculadora"
            >
              <X size={24} />
            </button>
            <SavingsCalculator />
          </div>
        </div>
      )}
    </div>
  )
}

