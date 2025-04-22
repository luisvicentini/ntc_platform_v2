"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

const benefits = [
  {
    number: 1,
    title: "Desconto de até 50% em restaurantes avaliados pelo Leo pra você usar toda semana",
    description: "",
  },
  {
    number: 2,
    title: "Sorteios exclusivos todos os meses para participardas experiências com o Leo na faixa!",
    description: "",
  },
  {
    number: 3,
    title: "Comunidade Exclusiva no WhatsApp com descontos extras, dicas, indicações e sorteios",
    description: "",
  },
  {
    number: 4,
    title: "Descontos em Parceiros, Carnes, Bebidas, Empórios, etc",
    description: "",
  },
  {
    number: 5,
    title: "Produtos Exclusivos da Grife Não Tem Chef",
    description: "",
  },
  {
    number: 6,
    title: "Descontos nos melhores cursos do ramo gastronômico do Brasil",
    description: "",
  }

]

export default function Benefits() {
  return (
    <section className="py-12 px-4 md:px-8 lg:px-16">

      {/* Título da seção */}
      <h2 className="md:w-[60%] mx-auto font-bold line-height-3 max-sm:text-xl md:text-2xl lg:text-4xl mb-8 text-center">
        <span className="px-2 py-1 text-[#f24957]">Algumas vantagens</span> de ser assinante do Clube Não Tem Chef
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
    <div className="hover:scale-105 transition-all">
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
          <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
          <p className="text-gray-400 text-sm">{benefit.description}</p>
        </div>
      </motion.div>
    </div>
  )
}
