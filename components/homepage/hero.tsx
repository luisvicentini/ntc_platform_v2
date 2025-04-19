"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Play } from "lucide-react"
import PreReservaModal from "./pre-reserva-modal"

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const headerRef = useRef<HTMLDivElement>(null)

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
    background: `radial-gradient(
      circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, 
      rgba(255, 87, 51, 0.15) 0%, 
      rgba(26, 26, 26, 1) 70%
    )`,
    transition: "background 0.3s ease-out",
  }

  return (
    <section
      ref={headerRef}
      className="relative pt-10 pb-4 px-4 md:px-8 lg:px-16 overflow-hidden"
      style={gradientStyle}
    >

      {/* Faixas "Não Tem Chef" */}
      <div className="relative -mt-8 mb-28 -mx-16">
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
        className="flex justify-center mb-8 max-sm:mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Image
          src="/homepage/logo.svg"
          alt="Não Tem Chef Logo"
          width={120}
          height={60}
          className="object-contain max-sm:w-[5rem] max-md:w-[8rem]"
        />
      </motion.div>

      {/* Título principal */}
      <motion.div
        className="text-center mb-8 max-md:w-[80%] max-sm:w-[100%] mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        <h1 className="font-bold line-height-3 max-sm:text-2xl max-md:text-4xl lg:text-5xl  mb-2">
          O único clube que te dá <span className="text-[#F24957] px-2">descontos</span> nos melhores restaurantes de São Paulo
        </h1>
      </motion.div>

      {/* Vídeo */}
      <motion.div
        className="relative w-full max-w-3xl mx-auto aspect-video mb-8 rounded-lg overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {isVideoPlaying ? (
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
            title="Não Tem Chef Vídeo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0"
          />
        ) : (
          <div className="relative w-full h-full bg-black/50">
            <Image src="/homepage/video-thumbnail.jpg" alt="Thumbnail do vídeo" fill className="object-cover" />
            <button
              onClick={() => setIsVideoPlaying(true)}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <Play size={40} className="text-white ml-2" />
              </div>
            </button>
          </div>
        )}
      </motion.div>

      {/* Botão CTA */}
      <motion.div
        className="flex justify-center mb-8"
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
