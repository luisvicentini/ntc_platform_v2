"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Bell, Play } from "lucide-react"
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

export default function Hero() {
  
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
      className="relative pt-40 pb-4 px-4 md:px-8 lg:px-16 overflow-hidden bg-[url('/homepage/bg-ntc.jpg')] bg-center bg-top bg-cover bg-no-repeat max-md:bg-[url('/homepage/bg-ntc-mobile.jpg')] max-md:bg-contain"
    >

      {/* Logo */}
      {/* <motion.div
        className="flex justify-center mb-4 max-sm:mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Image
          src="/homepage/logo.svg"
          alt="Não Tem Chef Logo"
          width={150}
          height={60}
          className="object-contain max-sm:w-[5rem] max-md:w-[8rem]"
        />
      </motion.div> */}

      {/* Título principal */}
      <motion.div
        className="text-center mb-8 max-md:w-[80%] max-sm:w-[100%] mx-auto max-w-[900px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
          <h1 className={`${fontPrimaryNTC.className} font-bold max-sm:leading-[1] leading-normal max-sm:text-[1.8rem] min-md:text-4xl lg:text-5xl mb-2`}>
          O único clube de vantagens que te dá <span className="text-[#F24957] px-2">descontos de até 50%</span> nos melhores restaurantes.
        </h1>
        <p className="text-zinc-300 text-lg sm:text-xl max-sm:text-sm pt-2">Do Michelin ao Podrão, só no <b className="text-white">Clube Não Tem Chef!</b></p>
      </motion.div>

      {/* Bloco de Vídeo */}
      <motion.div
        className="relative w-full max-w-3xl mx-auto aspect-video mb-4 rounded-lg overflow-hidden"
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
        className="flex justify-center mb-8 max-w-[1200px] mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
       <button
          onClick={scrollToPlans}
          className="bg-[#4CAF50] hover:bg-[#45a049] max-sm:w-[100%] lg:w-[80%] xl:w-[70%] text-white font-bold py-3 px-8 rounded-xl max-sm:text-xl lg:text-xl xl:text-xl hover:scale-105 transition-all"
        >
          QUERO ENTRAR NO CLUBE
        </button>
      </motion.div>

    </section>
  )
}


