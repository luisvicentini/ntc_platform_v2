"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import PreReservaModal from "./pre-reserva-modal"

const restaurants = [
  {
    name: "Ryo",
    category: "Culinária japonesa",
    discount: "25%",
    image: "/images/restaurant-1.jpg",
  },
  {
    name: "Jun Sakamoto",
    category: "Culinária japonesa",
    discount: "30%",
    image: "/images/restaurant-2.jpg",
  },
  {
    name: "Sushi Yaz",
    category: "Culinária japonesa",
    discount: "40%",
    image: "/images/restaurant-3.jpg",
  },
  {
    name: "Bistrot de Paris",
    category: "Culinária francesa",
    discount: "35%",
    image: "/images/restaurant-4.jpg",
  },
  {
    name: "Pinocchio",
    category: "Culinária italiana",
    discount: "20%",
    image: "/images/restaurant-5.jpg",
  },
  {
    name: "NTMJ",
    category: "Culinária japonesa",
    discount: "50%",
    image: "/images/restaurant-6.jpg",
  },
  {
    name: "Hobby Hamburger",
    category: "Burger food",
    discount: "25%",
    image: "/images/restaurant-7.jpg",
  },
  {
    name: "Toreto Valerio",
    category: "Culinária japonesa",
    discount: "30%",
    image: "/images/restaurant-8.jpg",
  },
  {
    name: "Hamburguinho",
    category: "Burger food",
    discount: "45%",
    image: "/images/restaurant-9.jpg",
  },
  {
    name: "Maius",
    category: "Burger tradicional",
    discount: "20%",
    image: "/images/restaurant-10.jpg",
  },
  {
    name: "Patties",
    category: "Hamburgueria",
    discount: "35%",
    image: "/images/restaurant-11.jpg",
  },
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
        <div className="absolute -right-4 top-0 md:right-20 lg:right-40">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-[#f24957] rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-center leading-tight">
                DESCONTOS
                <br />
                DE ATÉ
                <br />
                50%
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-special-gothic font-bold mb-2">
          <span className="bg-[#f24957] px-2 py-1">DESCONTOS</span> DE ATÉ 50%
        </h2>
        <h2 className="text-3xl md:text-4xl font-special-gothic font-bold">EM RESTAURANTES COMO:</h2>
      </motion.div>

      {/* Grade de restaurantes */}
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {restaurants.map((restaurant, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="relative rounded-lg overflow-hidden"
          >
            <div className="aspect-square relative">
              <Image src={restaurant.image || "/placeholder.svg"} alt={restaurant.name} fill className="object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3">
                <h3 className="font-bold text-lg">{restaurant.name}</h3>
                <p className="text-sm text-gray-300">{restaurant.category}</p>
              </div>
              <div className="absolute top-2 right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center">
                <span className="text-black font-bold text-sm">{restaurant.discount}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Botão "E muito mais!" */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: restaurants.length * 0.05 }}
          className="flex items-center justify-center"
        >
          <div className="bg-[#f24957] rounded-full px-6 py-3 font-bold text-lg">E muito mais!</div>
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
          className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-8 rounded-full text-lg transition-all"
        >
          Fazer minha pré-reserva para o Clube
        </button>
      </motion.div>

      {/* Faixas "Não Tem Chef" inferior */}
      <div className="relative h-24 -mx-4 md:-mx-8 lg:-mx-16 mt-12 overflow-hidden">
        {/* Faixa amarela com texto vermelho (atrás) */}
        <div className="absolute inset-0 bg-[#FFCC00] transform -rotate-1 translate-y-2">
          <div className="absolute inset-0 flex items-center">
            <div className="animate-marquee whitespace-nowrap">
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <span key={i} className="text-xl font-special-gothic font-bold mx-4 text-[#f24957]">
                    NÃO TEM CHEF!
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* Faixa laranja com texto branco (frente) */}
        <div className="absolute inset-0 bg-zinc-900 transform rotate-1">
          <div className="absolute inset-0 flex items-center">
            <div className="animate-marquee-reverse whitespace-nowrap">
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <span key={i} className="text-xl font-special-gothic font-bold mx-4 text-white">
                    NÃO TEM CHEF!
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de pré-reserva */}
      <PreReservaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
