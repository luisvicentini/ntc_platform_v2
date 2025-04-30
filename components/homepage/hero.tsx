"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Bell, Play } from "lucide-react"
import PreReservaModal from "./pre-reserva-modal"
import { Archivo_Black } from "next/font/google"
import { generateVoucherCode } from "@/lib/utils/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { url } from "inspector"

const fontPrimaryNTC = Archivo_Black({
  weight: ["400"],
  subsets: ["latin"],
})

const listvouchers = [
  {
    name: "Eataly",
    category: "Cozinha Italiana",
    city: "São Paulo",
    rating: "5",
    image: "https://naotemchef.com.br/homepage/restaurantes/image-11.jpg",
  },
  {
    name: "Torero Valese",
    category: "Cozinha Italiana",
    city: "São Paulo",
    rating: "4.9",
    image: "https://naotemchef.com.br/homepage/restaurantes/image-7.jpg",
  },
  {
    name: "Pinocchio burguer",
    category: "Burger Food",
    city: "São Paulo",
    rating: "4.1",
    image: "https://naotemchef.com.br/homepage/restaurantes/image-4.jpg",
  },
  {
    name: "Bistrot de Paris",
    category: "Cozinha Francesa",
    city: "São Paulo",
    rating: "4.3",
    image: "https://naotemchef.com.br/homepage/restaurantes/image-3.jpg",
  },
  {
    name: "Mamma San",
    category: "Cozinha ...",
    city: "São Paulo",
    rating: "5",
    image: "https://naotemchef.com.br/homepage/restaurantes/image-14.jpg",
  },
  {
    name: "Picanharia dos amigos",
    category: "Churrascaria",
    city: "São Paulo",
    rating: "4.2",
    image: "https://naotemchef.com.br/homepage/restaurantes/image-13.jpg",
  }
]

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalBrowserOpen, setIsModalBrowserOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const headerRef = useRef<HTMLDivElement>(null)
  const [showVoucher, setShowVoucher] = useState(false)
  const [voucherCode, setVoucherCode] = useState("")


  // Efeito para rastrear a posição do mouse para o gradiente animado
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (headerRef.current) {
        const { left, top, width, height } = headerRef.current.getBoundingClientRect()
        const x = (e.clientX - left) / width
        const y = (e.clientY - top) / height
        setMousePosition({ x, y })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Efeito para rastrear o scroll para o gradiente animado
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const scrollY = window.scrollY
        const { height } = headerRef.current.getBoundingClientRect()
        const y = Math.min(scrollY / height, 1)
        setMousePosition((prev) => ({ ...prev, y }))
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Estilo dinâmico para o gradiente baseado na posição do mouse
  const gradientStyle = {
    background: `url('/homepage/bg-ntc.jpg') center top / cover no-repeat`,
    transition: "background 0.3s ease-out",
  }

  return (
    <section
      ref={headerRef}
      className="relative pt-10 pb-4 px-4 md:px-8 lg:px-16 overflow-hidden bg-[url('/homepage/bg-ntc.jpg')] bg-center bg-top bg-cover bg-no-repeat max-md:bg-[url('/homepage/bg-ntc-mobile.jpg')] max-md:bg-contain"
    >

      {/* Faixas "Não Tem Chef" */}
      <div className="relative -mt-8 mb-16 -mx-16">
        {/* Faixa amarela com texto vermelho (atrás) */}
        <div className="absolute h-8 w-full inset-0 bg-[#FFCC00] transform -rotate-3 translate-y-2 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center h-full">
            {/* Versão mobile - 3 imagens */}
            <div className="flex md:hidden">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <span key={i} className="flex items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={200} />
                  </span>
                ))}
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <span key={`duplicate-mobile-${i}`} className="flex items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={200} />
                  </span>
                ))}
            </div>
            {/* Versão desktop - 10 imagens */}
            <div className="hidden md:flex">
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <span key={i} className="flex items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={200} />
                  </span>
                ))}
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <span key={`duplicate-desktop-${i}`} className="flex items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={200} />
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* Faixa laranja com texto branco (frente) */}
        <div className="absolute h-8 w-full inset-0 bg-[#F24957] transform rotate-3 overflow-hidden">
          <div className="animate-marquee-reverse whitespace-nowrap flex items-center h-full">
            {/* Versão mobile - 3 imagens */}
            <div className="flex md:hidden">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <span key={i} className="flex items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={200} />
                  </span>
                ))}
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <span key={`duplicate-mobile-${i}`} className="flex items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={200} />
                  </span>
                ))}
            </div>
            {/* Versão desktop - 10 imagens */}
            <div className="hidden md:flex">
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <span key={i} className="flex items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={200} />
                  </span>
                ))}
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <span key={`duplicate-desktop-${i}`} className="flex items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={200} />
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logo */}
      <motion.div
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
      </motion.div>

      {/* Título principal */}
      <motion.div
        className="text-center mb-8 max-md:w-[80%] max-sm:w-[100%] mx-auto max-w-[900px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
          <h1 className={`${fontPrimaryNTC.className} font-bold line-height-3 max-sm:text-2xl max-md:text-4xl lg:text-5xl  mb-2`}>
          O único clube de vantagens que te dá <span className="text-[#F24957] px-2">descontos de até 50%</span> nos melhores restaurantes de verdade.
        </h1>
        <p className="text-zinc-300 text-lg sm:text-xl max-sm:text-[1rem] pt-2">Aqui não tem jabá, aqui é <b className="text-white">Não Tem Chef!</b></p>
      </motion.div>

      {/* Bloco de Vídeo */}
      <motion.div
        className="relative w-full max-w-3xl mx-auto aspect-video mb-8 rounded-lg overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div style={{position: "relative", paddingTop: "56.25%"}}>
            <iframe id="panda-bee73ec5-d845-4d70-b4d5-2a879755343e" 
            src="https://player-vz-f47b157e-3fb.tv.pandavideo.com.br/embed/?v=bee73ec5-d845-4d70-b4d5-2a879755343e"
            style={{border: "none", position: "absolute", top: "0", left: "0"}}
            allowFullScreen={true}
            width="100%"
            height="100%"
          />
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
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4CAF50] hover:bg-[#45a049] max-sm:w-[100%] lg:w-[80%] xl:w-[70%] text-white font-bold py-3 px-8 rounded-xl max-sm:text-xl lg:text-xl xl:text-xl hover:scale-105 transition-all"
        >
          Fazer minha pré-reserva para o Clube
        </button>
      </motion.div>


      

      
      {/* Modal de pré-reserva */}
      <PreReservaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}


