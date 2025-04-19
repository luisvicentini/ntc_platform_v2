"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import PreReservaModal from "./pre-reserva-modal"

const restaurants = [
  {
    name: "Ryo",
    category: "Culinária Japonesa",
    discount: "25%",
    image: "/homepage/restaurantes/image.jpg",
    logo: "/homepage/restaurantes-logos/image1.jpg",
  },
  {
    name: "Jun Sakamoto",
    category: "Gastronomia Japonesa",
    discount: "30%",
    image: "/homepage/restaurantes/image-1.jpg",
    logo: "/homepage/restaurantes-logos/image2.jpg",
  },
  {
    name: "Sushi Vaz",
    category: "Culinária Japonesa",
    discount: "40%",
    image: "/homepage/restaurantes/image-2.jpg",
    logo: "/homepage/restaurantes-logos/image3.jpg",
  },
  {
    name: "Bistrot de Paris",
    category: "Cozinha Francesa",
    discount: "35%",
    image: "/homepage/restaurantes/image-3.jpg",
    logo: "/homepage/restaurantes-logos/image4.jpg",
  },
  {
    name: "Pinocchio",
    category: "Cozinha Italiana",
    discount: "20%",
    image: "/homepage/restaurantes/image-4.jpg",
    logo: "/homepage/restaurantes-logos/image5.jpg",
  },
  {
    name: "NTMU",
    category: "Steak House",
    discount: "50%",
    image: "/homepage/restaurantes/image-5.jpg",
    logo: "/homepage/restaurantes-logos/image6.jpg",
  },
  {
    name: "Hobby Hamburger",
    category: "Burger Food",
    discount: "25%",
    image: "/homepage/restaurantes/image-6.jpg",
    logo: "/homepage/restaurantes-logos/image7.jpg",
  },
  {
    name: "Torero Valese",
    category: "Cozinha Espanhola",
    discount: "30%",
    image: "/homepage/restaurantes/image-7.jpg",
    logo: "/homepage/restaurantes-logos/image8.jpg",
  },
  {
    name: "Hamburguinho",
    category: "Burger Food",
    discount: "45%",
    image: "/homepage/restaurantes/image-8.jpg",
    logo: "/homepage/restaurantes-logos/image9.jpg",
  },
  {
    name: "Haus",
    category: "Burgeria Artesanal",
    discount: "20%",
    image: "/homepage/restaurantes/image-9.jpg",
    logo: "/homepage/restaurantes-logos/image10.jpg",
    },
  {
    name: "Patties",
    category: "Hamburgueria",
    discount: "35%",
    image: "/homepage/restaurantes/image-10.jpg",
    logo: "/homepage/restaurantes-logos/image11.jpg",
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
        <div className="absolute -right-20 top-0 md:right-20 lg:right-40">
          <div className="relative w-28 h-24">
            <Image src="/homepage/selo-ntc.svg" alt="Selo NTC" fill />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-special-gothic font-bold mb-2 w-[60%] mx-auto">
          <span className="px-2 py-1 text-[#f24957]">Descontos</span> de até 50% em restaurantes como:
        </h2>
      </motion.div>

      {/* Grade de restaurantes */}
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {restaurants.map((restaurant, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="relative rounded-xl overflow-hidden"
          >
            <div className="aspect-square relative">
              <Image src={restaurant.image || "/placeholder.svg"} alt={restaurant.name} fill className="object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a]/90 p-4">
                <h3 className="font-bold text-lg">{restaurant.name}</h3>
                <p className="text-sm text-gray-300">{restaurant.category}</p>
              </div>
              <div className="absolute bottom-2 right-2 bg-[#1a1a1a] rounded-full w-14 h-14 border-2 border-[#1a1a1a] flex items-center justify-center overflow-hidden">
                <Image src={restaurant.logo} alt={restaurant.name} fill className="object-cover" />
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
          <div className="font-bold text-4xl">E muito<br /> mais!</div>
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
      <div className="relative mt-16 md:-mx-8 lg:-mx-16 z-10">
        {/* Faixa amarela com texto vermelho (atrás) */}
        <div className="absolute h-12 w-full inset-0 bg-[#FFCC00] transform -rotate-3 translate-y-2">
          <div className="absolute inset-0 flex items-center justify-between">
            <div className="animate-marquee whitespace-nowrap flex flex-row justify-between overflow-hidden">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <span key={i} className="items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={100} />
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* Faixa laranja com texto branco (frente) */}
        <div className="absolute h-12 w-full inset-0 bg-[#F24957] transform rotate-3">
          <div className="absolute inset-0 flex items-center">
            <div className="animate-marquee whitespace-nowrap flex flex-row justify-between overflow-hidden">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <span key={i} className="items-center">
                    <Image src="/homepage/naotemchef-text.svg" alt="Não Tem Chef" width={200} height={100} />
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
