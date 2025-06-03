"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import PreReservaModal from "../homepage/pre-reserva-modal"

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
  },
  {
    name: "E muito mais!",
    image: "/homepage/tipos-restaurantes/mais.jpg",
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

  // Função para scroll suave até a seção de planos
  const scrollToPlans = () => {
    const plansSection = document.getElementById('plans')
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="py-12 px-4 md:px-8 lg:px-16 relative bg-zinc-100">

      {/* Título da seção */}
      <motion.div
        ref={titleRef}
        initial={{ opacity: 0 }}
        animate={titleInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-8 relative"
      >
        <h2 className="max-md:w-[80%] lg:w-[80%] mx-auto font-bold line-height-3 max-sm:text-xl md:text-3xl lg:text-4xl text-center text-zinc-800">
          <span className="px-2 py-1 text-zinc-500">Descontos</span> exclusivos nos melhores:
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
              <h3 className="font-medium text-lg md:text-xl text-white group-hover:text-[#F24957] transition-colors text-center">
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
          className="bg-[#F24957] rounded-xl p-6 flex items-center justify-center hover:scale-105 duration-300 transition-all cursor-pointer w-full"
        >
          <div className="text-center">
            <span className="font-medium text-2xl md:text-2xl max-sm:text-xl">
              Do Michelin ao Podrão, só no Clube Não tem Chef!
            </span>
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
          onClick={scrollToPlans}
          className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-8 rounded-xl text-1xl hover:scale-105 transition-all"
        >
          QUERO ENTRAR NO CLUBE COM DESCONTOS EXCLUSIVOS
        </button>
      </motion.div>


      {/* Modal de pré-reserva */}
      <PreReservaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
