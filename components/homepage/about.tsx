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
    <section ref={ref} className="py-32 max-md:pb-0 px-4 max-md:px-0 lg:px-16 bg-gradient-to-l from-red-500 to-red-900 bg-cover bg-no-repeat bg-right relative">
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mx-auto flex flex-row max-md:flex-col overflow-hidden"
      >
        <div className="flex flex-col max-md:mx-8 z-10">
          <h2 className="text-3xl md:text-4xl font-primary-ntc font-bold mb-8 text-left ml-20 max-md:ml-0">
            Quem é <span className="text-yellow-500 px-2 py-1">Leo Corvo</span>?
          </h2>

          <div className="flex flex-1 max-w-4xl ml-20 max-md:ml-0">
            <div className="md:w-2/3">
              <p className="text-white mb-6 text-xl leading-relaxed">
                Leo Corvo é um dos mais apaixonados amantes da culinária, viajou os quatro cantos do mundo atrás de
                conhecer os restaurantes perfeitos. <br /><br />É reconhecido como um dos nomes mais potentes da crítica gastronômica
                nos principais veículos do país. Hoje, um conta perfil nas redes sociais com milhares de influenciadores
                que são pagos pra falar bem dos restaurantes que visitam.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-8 rounded-xl text-1xl hover:scale-105 transition-all"
              >
                Fazer minha pré-reserva para o Clube
              </button>
            </div>
          </div>
        </div>
        <div className="absolute max-md:relative bottom-0 right-0 max-md:-right-14 max-md:top-5">
          <Image src="/homepage/leo-corvo.png" alt="Leo Corvo" width={650} height={500} />
        </div>
      </motion.div>

      {/* Modal de pré-reserva */}
      <PreReservaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
