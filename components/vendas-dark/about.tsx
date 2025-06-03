"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import PreReservaModal from "../homepage/pre-reserva-modal"

export default function About() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ref, inView] = useInView({
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
    <section ref={ref} className="pt-32 pb-32 max-sm:pt-12 max-sm:pb-0 max-md:pb-0 px-4 max-md:px-0 lg:px-16 bg-gradient-to-l from-zinc-950 to-zinc-900 bg-cover bg-no-repeat bg-right relative">
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mx-auto flex flex-row max-md:flex-col overflow-hidden"
      >
        <div className="flex flex-col max-md:mx-8 z-10">
          <h2 className="text-3xl md:text-4xl font-primary-ntc font-bold mb-8 text-left ml-20 max-md:ml-0 text-zinc-400">
            Quem é <span className="text-zinc-200 px-2 py-1">Leo Corvo</span>?
          </h2>

          <div className="flex flex-1 max-w-4xl ml-20 max-md:ml-0">
            <div className="md:w-2/3">
              <p className="text-zinc-500 mb-6 text-md leading-relaxed">
                Leo Corvo é um dos mais apaixonados amantes da culinária, viajou os quatro cantos do mundo atrás de
                conhecer os restaurantes perfeitos. <br /><br />É reconhecido como um dos nomes mais potentes da crítica gastronômica
                nos principais veículos do país. Hoje, um conta perfil nas redes sociais com milhares de influenciadores
                que são pagos pra falar bem dos restaurantes que visitam.
              </p>
              <button
                onClick={scrollToPlans}
                className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-8 rounded-xl text-1xl hover:scale-105 transition-all"
              >
                Quero entrar no Clube
              </button>
            </div>
          </div>
        </div>
        <div className="absolute max-md:relative bottom-0 right-0 max-md:-right-14 max-md:top-5">
          <Image src="/homepage/leo-corvo.png" alt="Leo Corvo" width={650} height={500} />
        </div>
      </motion.div>

    </section>
  )
}
