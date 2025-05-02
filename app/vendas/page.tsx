"use client"

import { useState, useEffect, Suspense } from "react"
import Hero from "@/components/vendas/hero"
import Benefits from "@/components/vendas/benefits"
import Restaurants from "@/components/vendas/restaurants"
import About from "@/components/vendas/about"
import Footer from "@/components/vendas/footer"
import Countdown from "@/components/vendas/countdown"
import BonusSection from "@/components/vendas/bonus-section"
import PlansSection from "@/components/vendas/plans-section"
import HowItWorks from "@/components/vendas/how-it-works"
import FAQSection from "@/components/vendas/faq-section"

export default function VendasPage() {
  return (
    <div className="bg-black text-white overflow-hidden">
      {/* Topbar com countdown */}
      <Countdown initialMinutes={14} initialSeconds={0} />
      
      {/* Hero section com vídeo */}
      <Hero />
      
      {/* Seção de benefícios (modificada para carrossel) */}
      <Benefits isCarousel={true} />
      
      {/* Restaurantes */}
      <Restaurants />
      
      {/* Seção de bônus */}
      <BonusSection />
      
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