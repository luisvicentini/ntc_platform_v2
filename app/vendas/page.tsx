"use client"

import { useState, useEffect } from "react"
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
      <PlansSection />
      
      {/* Como funciona o clube */}
      <HowItWorks />
      
      {/* FAQ */}
      <FAQSection />
      
      {/* Sobre */}
      <About />
      
      {/* Footer */}
      <Footer />
    </div>
  )
} 