"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import PreReservaModal from "./pre-reserva-modal"

const restaurants = [
  
  {
    name: "Restaurantes Italianos",
    image: "/homepage/tipos-restaurantes/italiano.jpg",
  },
  {
    name: "Restaurantes Árabes",
    image: "/homepage/tipos-restaurantes/arabe.jpg",
  },
  {
    name: "Restaurantes Japoneses",
    image: "/homepage/tipos-restaurantes/japones.jpg",
  },
  {
    name: "Restaurantes Franceses",
    image: "/homepage/tipos-restaurantes/frances.jpg",
  },
  {
    name: "Restaurantes Típicos Brasileiros",
    image: "/homepage/tipos-restaurantes/brasileiro.jpg",
  },
  {
    name: "Hamburguerias",
    image: "/homepage/tipos-restaurantes/hamburgueria.jpg",
  },
  {
    name: "Pizzarias",
    image: "/homepage/tipos-restaurantes/pizzaria.jpg",
  },
  {
    name: "Botecos",
    image: "/homepage/tipos-restaurantes/boteco.jpg",
  }
]

export default function Restaurants() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [titleRef, titleInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section className="py-12 px-4 md:px-8 lg:px-16 relative">

      {/* Título da seção */}
      <motion.div
        ref={titleRef}
        initial={{ opacity: 0 }}
        animate={titleInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12 relative"
      >
        <div className="absolute -right-20 top-0 max-sm:-right-12 md:-right-10 lg:right-10">
          <div className="relative w-28 max-sm:w-28 h-24">
            <Image src="/homepage/selo-ntc.svg" alt="Selo NTC" fill />
          </div>
        </div>

        <h2 className="max-md:w-[60%] lg:w-[40%] mx-auto font-bold line-height-3 max-sm:text-xl md:text-2xl lg:text-4xl mb-4 text-center">
          <span className="px-2 py-1 text-[#f24957]">Descontos</span> de até 50% nos melhores:
        </h2>
      </motion.div>

      {/* Grade de tipos de restaurantes */}
      <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {restaurants.map((restaurant, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="relative h-48 rounded-xl overflow-hidden hover:scale-105 duration-300 transition-all group cursor-pointer"
          >
            {/* Imagem de fundo */}
            <div className="absolute inset-0">
              <Image 
                src={restaurant.image}
                alt={restaurant.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Gradiente escuro */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Texto */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-bold text-lg md:text-xl text-white group-hover:text-[#F24957] transition-colors text-center">
                {restaurant.name}
              </h3>
            </div>
          </motion.div>
        ))}

        {/* Card "E muito mais!" */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: restaurants.length * 0.05 }}
          className="bg-[#F24957] rounded-xl p-6 flex items-center justify-center hover:scale-105 duration-300 transition-all cursor-pointer"
        >
          <div className="text-center">
            <span className="font-bold text-2xl md:text-3xl">
              E muito mais!
            </span>
            <p className="text-sm mt-2 opacity-90">
              Descubra todos os restaurantes
            </p>
          </div>
        </motion.div>
      </div>

      {/* Botão CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex justify-center mt-12"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-8 rounded-xl text-1xl hover:scale-105 transition-all"
        >
          Fazer minha pré-reserva para o Clube
        </button>
      </motion.div>

      {/* Faixas "Não Tem Chef" */}
      <div className="relative mt-16 -mx-6 md:-mx-8 lg:-mx-16 z-10">
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
      </div>

      {/* Modal de pré-reserva */}
      <PreReservaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
