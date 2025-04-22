"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import PreReservaModal from "./pre-reserva-modal"

const restaurants = [
  
  {
    name: "Bistrot de Paris",
    category: "Cozinha Francesa",
    discount: "35%",
    image: "/homepage/restaurantes/image-3.jpg",
    logo: "/homepage/restaurantes-logos/image4.jpg",
  },
  {
    name: "All Fries Burger",
    category: "Burger Food",
    discount: "20%",
    image: "/homepage/restaurantes/image-15.jpg",
    logo: "",
  },
  {
    name: "Asa Açaí",
    category: "Açaí",
    discount: "20%",
    image: "/homepage/restaurantes/image-16.jpg",
    logo: "",
  },
  {
    name: "Xepa",
    category: "Cozinha ...",
    discount: "20%",
    image: "/homepage/restaurantes/image-17.jpg",
    logo: "",
  },
  {
    name: "Mamma San",
    category: "....",
    discount: "20%",
    image: "/homepage/restaurantes/image-14.jpg",
    logo: "",
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
    name: "Eataly",
    category: "Cozinha Italiana",
    discount: "20%",
    image: "/homepage/restaurantes/image-11.jpg",
    logo: "",
  },
  {
    name: "Picanharia dos amigos",
    category: "Churrascaria",
    discount: "20%",
    image: "/homepage/restaurantes/image-13.jpg",
    logo: "",
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
        <div className="absolute -right-20 top-0 max-sm:-right-12 md:-right-10 lg:right-10">
          <div className="relative w-28 max-sm:w-28 h-24">
            <Image src="/homepage/selo-ntc.svg" alt="Selo NTC" fill />
          </div>
        </div>

        <h2 className="max-md:w-[60%] lg:w-[40%] mx-auto font-bold line-height-3 max-sm:text-xl md:text-2xl lg:text-4xl mb-4 text-center">
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
            className="relative rounded-xl overflow-hidden hover:border-2 hover:border-white/30 duration-100 transition-all"
          >
            <div className="aspect-square relative">
              <Image src={restaurant.image || "/placeholder.svg"} alt={restaurant.name} fill className="object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a]/90 p-4">
                <h3 className="font-bold max-sm:text-2xl md:text-md lg:text-sm">{restaurant.name}</h3>
                <p className="text-sm text-gray-300">{restaurant.category}</p>
              </div>
              <div className="absolute bottom-2 right-2 bg-[#1a1a1a] rounded-full w-14 h-14 border-2 border-[#1a1a1a] flex items-center justify-center overflow-hidden">
                <Image src={restaurant.logo || "/placeholder.svg"} alt={restaurant.name} fill className="object-cover" />
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
