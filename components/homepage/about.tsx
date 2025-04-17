"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import PreReservaModal from "./pre-reserva-modal"

export default function About() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-12 px-4 md:px-8 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-3xl md:text-4xl font-special-gothic font-bold mb-8 text-center">
          QUEM É <span className="bg-[#f24957] px-2 py-1">LEO CORVO</span>?
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/3">
            <Image src="/images/leo-corvo.jpg" alt="Leo Corvo" width={300} height={400} className="rounded-lg" />
          </div>
          <div className="md:w-2/3">
            <p className="text-gray-300 mb-6">
              Leo Corvo é um dos mais apaixonados amantes da culinária, viajou os quatro cantos do mundo atrás de
              conhecer os restaurantes perfeitos. É reconhecido como um dos nomes mais potentes da crítica gastronômica
              nos principais veículos do país. Hoje, um conta perfil nas redes sociais com milhares de influenciadores
              que são pagos pra falar bem dos restaurantes que visitam.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-8 rounded-full text-lg transition-all"
            >
              Fazer minha pré-reserva para o Clube
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal de pré-reserva */}
      <PreReservaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
