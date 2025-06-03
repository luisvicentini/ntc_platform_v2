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
  backgroundImages?: string[]; // Nova propriedade para as imagens do carrossel
}

const defaultImages = [
  "/homepage/banner.jpg",
  "/homepage/banner2.jpg"
];

export default function Hero({ showPriceBlock = true, backgroundImages = defaultImages }: HeroProps) {
  
  const headerRef = useRef<HTMLDivElement>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Efeito para o carrossel automático
  useEffect(() => {
    if (backgroundImages.length > 1) {
      const timer = setTimeout(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 3000); // Muda a imagem a cada 3 segundos
      return () => clearTimeout(timer);
    }
  }, [currentImageIndex, backgroundImages]);

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
      className="relative pt-[40vh] pb-12 px-4 md:px-8 lg:px-16 overflow-hidden bg-zinc-100 "
    >
      {/* Bloco de background com carrossel */}
      <div className="absolute inset-0 z-0">
        {backgroundImages.map((src, index) => (
          <motion.div
            key={src}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === currentImageIndex ? 1 : 0 }}
            transition={{ duration: 1 }} // Duração da transição de fade
            className="absolute inset-0"
          >
            <Image 
              src={src} 
              alt={`Hero background ${index + 1}`} 
              fill 
              className="object-cover" 
              priority={index === 0} // Priorizar o carregamento da primeira imagem
            />
          </motion.div>
        ))}
        {/* Overlay preto ajustado */}
        <div className="absolute inset-0 h-[30%] bg-gradient-to-b from-black/40 to-transparent z-10"></div>
      </div>

      {/* Bloco de título principal */}
      <motion.div
        className="relative text-center mb-4 max-md:w-[80%] max-sm:w-[100%] mx-auto max-w-[900px] z-20" // z-20 para ficar acima do overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        <div className="flex items-center justify-center px-3 py-2 mb-4 mx-auto relative -mt-18 mb-18">
          <Image src="/homepage/selo-do-michelin-ao-podrao.png" alt="Logo" width={300} height={100} className="object-contain h-auto max-sm:w-[240px]" />
        </div>
        <h1 className={`${fontPrimaryNTC.className} font-bold leading-[1.2] text-4xl max-sm:text-[1.4rem] lg:text-3xl mb-2 text-zinc-800 mt-8`}>
          O único clube de vantagens que te dá <span className="text-[#F24957] px-2">descontos e experiências nos melhores restaurantes de São Paulo</span> avaliados pelo Léo Corvo
        </h1>

      <div className="flex flex-col items-center justify-center w-full gap-2 mt-8">
        {/* Bloco de preco */}
        {showPriceBlock && (
          <div className="flex items-center justify-center gap-4 w-full">
            <p className="text-zinc-700 text-lg text-left font-semibold leading-none">
              De <br/> <s className="font-semibold text-zinc-500">R$99,90</s> <br/> por
            </p>
            <div className="flex items-center text-zinc-900 py-1">
              <span className="text-lg font-medium text-zinc-700 -mr-4 -mt-10">R$</span>
              <span className="text-7xl font-extrabold tracking-tighter leading-none">49</span>
              <div className="flex flex-col items-start ml-0.5">
                <span className="text-3xl font-bold leading-none tracking-tight">,90</span>
                <span className="text-xl font-medium text-zinc-600 leading-tight mt-0.5">/mês</span>
              </div>
            </div>
            {/* <p className="text-zinc-600 text-lg text-center font-semibold">no plano anual</p> */}
          </div>
        )}

        {/* Bloco de botão CTA */}
        <div className="relative flex flex-col items-center justify-center max-w-[900px] mx-auto z-20 w-full">
          <motion.div
            className="flex flex-col items-center justify-center w-full mx-auto"
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
          </motion.div>
        </div>
      </div>
      </motion.div>

    </section>
  )
}


