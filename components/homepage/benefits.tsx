"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

const benefits = [
  {
    number: 1,
    title: "DESCONTOS DE ATÉ 50% EM RESTAURANTES",
    description: "Economize em cada refeição",
  },
  {
    number: 2,
    title: "COMUNIDADE EXCLUSIVA DE MEMBROS",
    description: "Conecte-se com outros amantes da gastronomia",
  },
  {
    number: 3,
    title: "PRODUTOS EXCLUSIVOS NÃO VENDIDOS NO MERCADO",
    description: "Acesso a itens especiais",
  },
  {
    number: 4,
    title: "DESCONTOS EM SERVIÇOS FINANCEIROS",
    description: "Vantagens além da gastronomia",
  },
  {
    number: 5,
    title: "SORTEIOS EXCLUSIVOS PARA OS MEMBROS",
    description: "Chances de ganhar experiências únicas",
  },
  {
    number: 6,
    title: "DESCONTOS EM CURSOS",
    description: "Aprimore seus conhecimentos gastronômicos",
  },
]

export default function Benefits() {
  return (
    <section className="py-12 px-4 md:px-8 lg:px-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {benefits.map((benefit, index) => (
          <BenefitCard key={index} benefit={benefit} index={index} />
        ))}
      </div>
    </section>
  )
}

function BenefitCard({ benefit, index }: { benefit: (typeof benefits)[0]; index: number }) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-[#2A2A2A] rounded-lg p-6 flex items-start"
    >
      <div className="mr-4">
        <div className="w-12 h-12 rounded-full bg-[#FF5733] flex items-center justify-center text-2xl font-bold">
          {benefit.number}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-special-gothic font-bold mb-2">{benefit.title}</h3>
        <p className="text-gray-400 text-sm">{benefit.description}</p>
      </div>
    </motion.div>
  )
}
