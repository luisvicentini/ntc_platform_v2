"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { BadgePercent, Bell, Play } from "lucide-react"
import PreReservaModal from "@/components/homepage/pre-reserva-modal"
import { Archivo_Black } from "next/font/google"
import { generateVoucherCode } from "@/lib/utils/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { url } from "inspector"
import router from "next/router"

const fontPrimaryNTC = Archivo_Black({
  weight: ["400"],
  subsets: ["latin"],
})

interface HeroProps {
  showPriceBlock?: boolean;
}

export default function Hero({ showPriceBlock = true }: HeroProps) {
  
  const headerRef = useRef<HTMLDivElement>(null)

  // Função para scroll suave até a seção de planos
  const scrollToPlans = () => {
    const plansSection = document.getElementById('plans')
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      ref={headerRef}
      className="relative pt-32 pb-4 px-4 md:px-8 lg:px-16 overflow-hidden bg-zinc-100 "
    >


      {/* Título principal */}
      <motion.div
        className="text-center mb-8 max-md:w-[80%] max-sm:w-[100%] mx-auto max-w-[900px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        <div className="flex items-center justify-center gap-1 bg-white rounded-full items-center justify-center shadow-md shadow-zinc-300 px-3 py-2 mb-4 mx-auto relative">
          <BadgePercent className="w-5 h-5 text-yellow-600 absolute top-1/2 left-4 -translate-y-1/2" />
          <div className="flex md:flex-row flex-col px-3">
            <div className="text-yellow-600 text-lg max-sm:text-[1rem] leading-[1.2]">Do Michelin ao Podrão, só no </div><div className="text-yellow-600 text-lg max-sm:text-[1rem] leading-[1.2] ml-1"><b>Clube Não Tem Chef!</b></div>
          </div>
        </div>
        <h1 className={`${fontPrimaryNTC.className} font-bold leading-[1.2] text-4xl max-sm:text-[1.4rem] lg:text-3xl mb-2 text-zinc-800`}>
          O único clube de vantagens que te dá <span className="text-[#F24957] px-2">descontos e experiências nos melhores restaurantes de São Paulo</span> avaliados pelo Léo Corvo
        </h1>
      </motion.div>


      <div className="flex flex-col items-center justify-center mb-8 max-w-[900px] mx-auto">
        {/* Bloco de Vídeo */}
        <motion.div
          className="relative w-full mx-auto aspect-video mb-4 rounded-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div style={{position: "relative", paddingTop: "56.25%"}}>
            <iframe id="panda-e8dc1524-3915-4cae-a779-e385c902a9f0" 
            src="https://player-vz-f47b157e-3fb.tv.pandavideo.com.br/embed/?v=e8dc1524-3915-4cae-a779-e385c902a9f0" 
            style={{border: "none", position: "absolute", top: "0", left: "0"}} 
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" 
            allowFullScreen={true} 
            width="100%" 
            height="100%" 
            >
            </iframe>
          </div>
        </motion.div>

        {/* Botão CTA */}
        <motion.div
          className="flex flex-col items-center justify-center mb-8 w-full mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
        <button
            onClick={scrollToPlans}
            className="bg-[#4CAF50] hover:bg-[#45a049] w-full text-white font-bold py-3 px-8 rounded-xl max-sm:text-xl lg:text-xl xl:text-xl hover:scale-105 transition-all"
          >
            QUERO ENTRAR NO CLUBE
          </button>

          {/* Bloco de preco */}
          {showPriceBlock && (
            <p className="text-zinc-500 text-lg max-sm:text-[16px] pt-4 text-center">De <s className="text-red-700">R$99,90</s> por <span className="font-semibold text-green-600">R$49,90/mês</span> no plano anual</p>
          )}
        </motion.div>
      </div>

    </section>
  )
}


