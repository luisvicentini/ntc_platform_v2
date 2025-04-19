"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

const benefits = [
  {
    number: 1,
    title: "Descontos de até 50% em restaurantes",
    description: "Economize em cada refeição",
  },
  {
    number: 2,
    title: "Comunidade exclusiva no WhatsApp",
    description: "Conecte-se com outros amantes da gastronomia",
  },
  {
    number: 3,
    title: "Produtos exclusivos 'Não Tem Chef'",
    description: "Acesso a itens especiais",
  },
  {
    number: 4,
    title: "Descontos em produtos de parceiros",
    description: "Vantagens além da gastronomia",
  },
  {
    number: 5,
    title: "Sorteios exclusivos para os assinantes",
    description: "Chances de ganhar experiências únicas",
  },
  {
    number: 6,
    title: "Descontos em cursos",
    description: "Aprimore seus conhecimentos gastronômicos",
  },
]

export default function Benefits() {
  return (
    <section className="py-12 px-4 md:px-8 lg:px-16">

      {/* Título da seção */}
        <h2 className="text-3xl md:text-4xl font-special-gothic font-bold mb-8 w-[60%] mx-auto text-center">
          <span className="px-2 py-1 text-[#f24957]">Todas as vantagens</span> de ser um membro do Não Tem Chef
        </h2>
      
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
      className="bg-[#2A2A2A] rounded-xl p-6 flex items-start border-t border-r border-[#f24957]"
    >
      <div className="mr-4">
        <div className="w-16 h-16 text-[#f24957] flex items-center justify-center text-6xl font-bold">
          {benefit.number}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
        <p className="text-gray-400 text-sm">{benefit.description}</p>
      </div>
    </motion.div>
  )
}
