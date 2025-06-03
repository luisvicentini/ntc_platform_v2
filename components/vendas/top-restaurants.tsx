"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import PreReservaModal from "../homepage/pre-reserva-modal"
import { Ticket, TicketPercent } from "lucide-react"

const restaurants = [
  
  {
    name: "Nice To Meat U",
    percent: "15%",
  },
  {
    name: "Pinocchio Cuccina",
    percent: "10%",
  },
  {
    name: "Hamburguinho",
    percent: "25%",
  },
  {
    name: "Bar do Luis",
    percent: "10%",
  },
  {
    name: "Sushi Vaz",
    percent: "10%",
  },
  {
    name: "Torero Valese",
    percent: "25%",
  },
  {
    name: "Xepa",
    percent: "15%",
  },
  {
    name: "Luce",
    percent: "15%",
  },
  {
    name: "GrindHouse Braserito",
    percent: "10%",
  },
  {
    name: "Ginger",
    percent: "15%",
  },
  {
    name: "All Fries",
    percent: "20%",
  }
]

export default function TopRestaurants() {
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
    <section className="pt-16 max-sm:pt-8 pb-24 px-4 md:px-8 lg:px-16 relative bg-zinc-100">

      {/* Título da seção */}
      <motion.div
        ref={titleRef}
        initial={{ opacity: 0 }}
        animate={titleInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-8 relative"
      >
        <h2 className="px-2 py-1 max-md:w-[90%] lg:w-[70%] mx-auto font-bold line-height-3 max-sm:text-xl md:text-3xl lg:text-3xl mb-1 text-center text-zinc-800">
          <span className="text-[#F24957]">Veja alguns dos restaurantes</span> com descontos exclusivos que você vai ter acesso:
        </h2>
      </motion.div>

      {/* Grade de tipos de restaurantes */}
      <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-sm:gap-3 max-w-6xl mx-auto">
        {restaurants.map((restaurant, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="flex items-center justify-center h-14 gap-2 pl-4 pr-3 leading-none rounded-xl overflow-hidden hover:scale-105 duration-300 transition-all group cursor-pointer bg-white shadow-sm hover:shadow-md"
          >

            <div className="flex-1">
              <h3 className="font-semibold text-md max-sm:text-sm text-left text-zinc-800 group-hover:text-[#F24957] transition-colors whitespace-wrap text-wrap">
                {restaurant.name}
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-[#f24957]/10 text-[#f24957] font-semibold rounded-lg p-2 shadow-sm">
              <Ticket className="w-4 h-4 rotate-90" /> {restaurant.percent}
            </div>
          </motion.div>
        ))}

        {/* Card "E muito mais!" */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: restaurants.length * 0.05 }}
          className="p-2 flex items-center justify-center hover:scale-105 duration-300 transition-all cursor-pointer w-full"
        >
          <div className="text-center">
            <span className="font-medium text-2xl md:text-2xl max-sm:text-[16px] text-zinc-800">
              E Muito Mais!
            </span>
          </div>
        </motion.div>
      </div>


      {/* Modal de pré-reserva */}
      <PreReservaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
