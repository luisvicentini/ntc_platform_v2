"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Bell, Play } from "lucide-react"
import PreReservaModal from "./pre-reserva-modal"
import { Archivo_Black } from "next/font/google"
import { generateVoucherCode } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

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
        className="text-center mb-8 max-md:w-[80%] max-sm:w-[100%] mx-auto max-w-[1200px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
          <h1 className={`${fontPrimaryNTC.className} font-bold line-height-3 max-sm:text-2xl max-md:text-4xl lg:text-5xl  mb-2`}>
          O único clube que te dá <span className="text-[#F24957] px-2">descontos</span> nos melhores restaurantes de São Paulo
        </h1>
      </motion.div>

      {/* Browser Animation */}
      <motion.div 
        className="relative w-full max-w-4xl mx-auto mb-12 rounded-lg overflow-hidden bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Browser Header */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-4 bg-zinc-50 border-b border-zinc-200">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57] max-sm:w-[0.5rem] max-sm:h-[0.5rem]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] max-sm:w-[0.5rem] max-sm:h-[0.5rem]"></div>
              <div className="w-3 h-3 rounded-full bg-[#28C840] max-sm:w-[0.5rem] max-sm:h-[0.5rem]"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-full bg-zinc-100 text-zinc-600 text-sm max-sm:text-[0.8rem]">
                naotemchef.com.br
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full "></div>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200">
          <Image 
                src="https://naotemchef.com.br/homepage/logo.svg"
                alt="Não Tem Chef Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            <div className="flex items-center gap-4">
              
              <nav className="flex gap-6 text-sm">
                <a href="#" className="text-zinc-600 hover:text-zinc-900 max-sm:text-[0.7rem]">Feed</a>
                <a href="#" className="text-zinc-600 hover:text-zinc-900 max-sm:text-[0.7rem]">Meus cupons</a>
                <a href="#" className="text-zinc-600 hover:text-zinc-900 max-sm:text-[0.7rem]">Perfil</a>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
                <Bell size={20} className="text-zinc-600 hover:text-zinc-900" />
              <div className="w-10 h-10 rounded-full bg-zinc-200"><Avatar><AvatarFallback className="font-bold text-sm">LC</AvatarFallback></Avatar></div>
            </div>
          </div>
        </div>

        {/* Browser Content */}
        <div className="relative h-[400px] flex">
          {/* Main Content */}
          <motion.div 
            className="flex-1 p-6 grid grid-cols-3 gap-4 bg-zinc-100"
            animate={{ 
              x: [0, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            {listvouchers.map((listvouchers) => (
              <motion.div
                key={listvouchers.name}
                className="bg-white rounded-lg overflow-hidden shadow-md border border-zinc-100"
              >
                <div className="relative w-full h-24">
                  <Image
                    src={listvouchers.image}
                    alt=""
                    fill
                    className="object-cover"
                  />
                  <div className="flex flex-1 absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full max-sm:text-[0.6rem]">
                    <span>⭐{listvouchers.rating}</span>
                    <div className="bg-red-500 text-white px-2 ml-1 text-xs rounded-full max-sm:text-[0.6rem]">Selo: NTC</div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-zinc-800 font-semibold text-sm max-sm:text-[0.8rem]">{listvouchers.name}</h3>
                  <p className="text-zinc-500 text-xs max-sm:text-[10px] max-sm:text-[0.6rem]">{listvouchers.category}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="absolute right-0 top-0 w-[300px] h-full bg-white border-l-2 border-zinc-200"
            animate={{ 
              x: [100, 0],
              opacity: [0, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              repeatDelay: 5 // Adiciona um delay de 5 segundos entre cada repetição
            }}

          >
            <div className="p-6">
              <div className="relative h-32 rounded-lg overflow-hidden mb-4">
                <Image
                  src="https://naotemchef.com.br/homepage/restaurantes/image-3.jpg"
                  alt="Restaurante em destaque"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 bg-[#4CAF50] text-white text-sm px-2 py-1 rounded">
                  20% OFF
                </div>
              </div>
              <div className="space-y-2 w-full space-y-4">
                <div className="flex flex-col">
                  <h3 className="text-zinc-800 font-semibold text-lg max-sm:text-[1rem]">Bistrot de Paris</h3>
                  <span className="max-sm:text-[1rem] text-green-500 font-bold line-height-1">20% de desconto de segunda a sexta</span>
                </div>
                
                <div className="flex flex-row items-center gap-1 text-zinc-500 text-sm max-sm:text-[0.8rem]">
                  <span>⭐4.8</span>
                  <span>•</span>
                  <span>Valido para qualquer prato</span>
                </div>

                <div className="space-y-2">
                  {showVoucher ? (
                    <div className="text-center bg-zinc-100 p-2 rounded-lg">
                      <p className="text-zinc-600">Seu voucher foi gerado</p>
                      <p className="text-xl font-bold text-violet-500">{voucherCode}</p>
                    </div>
                  ) : (
                    <motion.button 
                      className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-4 rounded-lg transition-colors"
                      animate={{ scale: [1, 0.95, 1] }}
                      transition={{
                        duration: 0.5,
                        repeat: 0,
                        ease: "easeInOut"
                      }}
                      onAnimationComplete={async () => {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        setShowVoucher(true);
                        setVoucherCode(generateVoucherCode());
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        setShowVoucher(false);
                        setVoucherCode("");
                      }}
                    >
                      Gerar voucher
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>



      {/* Nao Excluir esse bloco de Vídeo */}
      {/* <motion.div
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
      </motion.div> */}

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


