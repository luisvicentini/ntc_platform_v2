"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { BadgeCheck, Award, Gift, Users, Timer } from "lucide-react"

// Dados dos bônus com diferentes níveis
const bonusTiers = [
  {
    title: "5 Primeiros",
    titleColor: "#F24957", // Vermelho
    borderColor: "#F24957",
    icon: "🔥",
    items: [
      "Vaga no curso de vinhos da Alexandra Corvo",
      "Tábua de corte + Abridor da Axt Wood & Steel",
      "Experiência gastronômica comigo, Léo Corvo (um por vez, 10 encontros exclusivos)",
      "Kit de Carnes Wessel",
      "Churrascada comigo",
      "Camiseta exclusiva do clube",
      "Kit Cerveja Império"
    ]
  },
  {
    title: "10 Primeiros",
    titleColor: "#FFD700", // Dourado
    borderColor: "#FFD700",
    icon: "🥇",
    items: [
      "Experiência gastronômica comigo, Léo Corvo (um por vez, 10 encontros exclusivos)",
      "Kit de Carnes Wessel",
      "Churrascada comigo",
      "Camiseta exclusiva do clube",
      "Kit Cerveja Império"
    ]
  },
  {
    title: "25 Primeiros",
    titleColor: "#CD7F32", // Bronze
    borderColor: "#CD7F32",
    icon: "🎁",
    items: [
      "Kit de Carnes Wessel",
      "Churrascada comigo",
      "Camiseta exclusiva do clube",
      "Kit Cerveja Império"
    ]
  },
  {
    title: "50 Primeiros",
    titleColor: "#C0C0C0", // Prata
    borderColor: "#C0C0C0",
    icon: "👥",
    items: [
      "Camiseta exclusiva do clube",
      "Kit Cerveja Império"
    ]
  }
]

export default function BonusSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-16 px-4 md:px-8 lg:px-16 bg-zinc-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="bg-gradient-to-r from-[#f56444] to-[#f24857] text-transparent bg-clip-text text-lg font-bold">
            PARA OS PRIMEIROS ASSINANTES
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-2 mb-4">
            Bônus Exclusivos e <span className="text-[#F24957]">Limitados</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Quanto mais cedo você entrar, mais bônus exclusivos vai receber! 
            Esses bônus são por tempo limitado e apenas para os primeiros assinantes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {bonusTiers.map((tier, tierIndex) => (
            <motion.div
              key={tierIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: tierIndex * 0.1 }}
              className="bg-zinc-800 rounded-xl overflow-hidden shadow-lg border-t-4"
              style={{ borderColor: tier.borderColor }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 
                    className="text-xl font-bold"
                    style={{ color: tier.titleColor }}
                  >
                    {tier.title}
                  </h3>
                  <div 
                    className="p-2 rounded-full" 
                    style={{ backgroundColor: `${tier.borderColor}20` }}
                  >
                    {tier.icon}
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {tier.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <BadgeCheck className="w-5 h-5 text-zinc-300 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-zinc-700 py-4 px-6 flex justify-center">
                <span className="font-medium text-zinc-300">
                  Oferta Limitada
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-zinc-300 font-normal">
            E os <span className="font-bold text-white">100 primeiros</span> assinantes vão ganhar uma Camiseta Exclusiva do Clube.
            <br />
            <span className="text-[#F24957] font-bold">Não perca essa oportunidade!</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
} 