"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const benefits = [
  {
    number: 1,
    title: "Desconto de até 50% em restaurantes avaliados pelo Leo pra você usar toda semana",
    description: "",
    image: "/homepage/beneficios/beneficio-1.jpg"
  },
  {
    number: 2,
    title: "Sorteios exclusivos todos os meses para participardas experiências com o Leo na faixa!",
    description: "",
    image: "/homepage/tipos-restaurantes/hamburgueria.jpg"
  },
  {
    number: 3,
    title: "Comunidade Exclusiva no WhatsApp com descontos extras, dicas, indicações e sorteios",
    description: "",
    image: "/homepage/tipos-restaurantes/hamburgueria.jpg"
  },
  {
    number: 4,
    title: "Descontos em Parceiros, Carnes, Bebidas, Empórios, etc",
    description: "",
    image: "/homepage/tipos-restaurantes/hamburgueria.jpg"
  },
  {
    number: 5,
    title: "Produtos Exclusivos da Grife Não Tem Chef",
    description: "",
    image: "/homepage/tipos-restaurantes/hamburgueria.jpg"
  },
  {
    number: 6,
    title: "Descontos nos melhores cursos do ramo gastronômico do Brasil",
    description: "",
    image: "/homepage/tipos-restaurantes/hamburgueria.jpg"
  }
]

interface BenefitsProps {
  isCarousel?: boolean
}

export default function Benefits({ isCarousel = false }: BenefitsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [visibleItems, setVisibleItems] = useState(3)

  // Calcula quantos itens são visíveis baseado no tamanho da tela
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) {
        setVisibleItems(1)
      } else if (window.innerWidth < 1024) {
        setVisibleItems(2)
      } else {
        setVisibleItems(3)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const nextSlide = () => {
    if (currentIndex < benefits.length - visibleItems) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setCurrentIndex(0)
    }
  }

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else {
      setCurrentIndex(benefits.length - visibleItems)
    }
  }

  return (
    <section className="py-12 px-4 md:px-8 lg:px-16">
      {/* Título da seção */}
      <h2 className="md:w-[60%] mx-auto font-bold line-height-3 max-sm:text-xl md:text-2xl lg:text-4xl mb-8 text-center">
        <span className="px-2 py-1 text-[#f24957]">Algumas vantagens</span> de ser assinante do Clube Não Tem Chef
      </h2>
      
      {isCarousel ? (
        <div className="relative max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={prevSlide}
              className="p-2 rounded-full bg-[#2A2A2A] text-white hover:bg-[#f24957] transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextSlide}
              className="p-2 rounded-full bg-[#2A2A2A] text-white hover:bg-[#f24957] transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          <div 
            ref={carouselRef}
            className="overflow-hidden"
          >
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleItems)}%)` }}
            >
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="px-2 flex-shrink-0"
                  style={{ width: `${100 / visibleItems}%` }}
                >
                  <BenefitCardWithImage benefit={benefit} index={index} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Indicadores */}
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: benefits.length - visibleItems + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-[#f24957]' : 'bg-gray-400'}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} benefit={benefit} index={index} />
          ))}
        </div>
      )}
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
          <div className="w-12 h-12 text-[#f24957] flex items-center justify-center text-6xl font-bold">
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

function BenefitCardWithImage({ benefit, index }: { benefit: (typeof benefits)[0]; index: number }) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <div className="hover:scale-105 transition-all h-full">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="bg-[#2A2A2A] rounded-xl overflow-hidden h-full flex flex-col border border-[#f24957]/30"
      >
        <div className="relative aspect-video w-full">
          <Image 
            src={benefit.image} 
            alt={benefit.title}
            fill
            className="object-cover"
            onError={(e) => {
              // Imagem fallback se a original não existir
              (e.target as HTMLImageElement).src = "/homepage/video-thumbnail.jpg"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A2A2A] to-transparent opacity-50"></div>
          <div className="absolute top-4 left-4 w-10 h-10 bg-[#f24957] text-white rounded-full flex items-center justify-center text-2xl font-bold">
            {benefit.number}
          </div>
        </div>
        <div className="p-6 flex-grow">
          <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
          <p className="text-gray-400 text-sm">{benefit.description}</p>
        </div>
      </motion.div>
    </div>
  )
}
