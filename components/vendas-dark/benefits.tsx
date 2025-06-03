"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import { useState, useRef, useEffect, TouchEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const benefits = [
  {
    number: 1,
    title: "Descontos nos melhores restaurantes de SP avaliados pelo Leo pra você usar toda semana",
    description: "",
    image: "/homepage/vantagens/descontos.jpg"
  },
  {
    number: 2,
    title: "Sorteios exclusivos todos os meses para participardas experiências com o Leo na faixa!",
    description: "",
    image: "/homepage/vantagens/sorteios.jpg"
  },
  {
    number: 3,
    title: "Comunidade no WhatsApp com descontos extras, dicas, indicações e sorteios",
    description: "",
    image: "/homepage/vantagens/comunidade.jpg"
  },
  {
    number: 4,
    title: "Descontos em Parceiros, Carnes, Bebidas, Empórios, etc",
    description: "",
    image: "/homepage/vantagens/parceiros.jpg"
  },
  {
    number: 5,
    title: "Produtos Exclusivos da Grife Não Tem Chef",
    description: "",
    image: "/homepage/vantagens/produtos.jpg"
  },
  {
    number: 6,
    title: "Descontos nos melhores cursos do ramo gastronômico do Brasil",
    description: "",
    image: "/homepage/vantagens/cursos.jpg"
  }
]

interface BenefitsProps {
  isCarousel?: boolean
}

export default function Benefits({ isCarousel = false }: BenefitsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [visibleItems, setVisibleItems] = useState(3)
  const [showPartial, setShowPartial] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Estado para controle de drag do mouse
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  
  // Controle de debounce para wheel
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isWheelActive, setIsWheelActive] = useState(false)

  // Calcula quantos itens são visíveis baseado no tamanho da tela
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) {
        setVisibleItems(1)
        setShowPartial(true)
        setIsMobile(true)
      } else if (window.innerWidth < 1024) {
        setVisibleItems(2)
        setShowPartial(false)
        setIsMobile(false)
      } else {
        setVisibleItems(3)
        setShowPartial(false)
        setIsMobile(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getCardWidth = () => {
    // Se for mobile e showPartial=true, cada card principal ocupa 80% da largura visível
    // e mostra 20% do próximo card
    if (isMobile && showPartial) {
      return 80
    }
    return 100 / visibleItems
  }

  const getTransformValue = () => {
    if (isMobile && showPartial) {
      // Cada card principal ocupa 80% da largura
      return `translateX(-${currentIndex * 80}%)`
    }
    return `translateX(-${currentIndex * (100 / visibleItems)}%)`
  }

  const getMaxIndex = () => {
    if (isMobile && showPartial) {
      // Permitimos um índice a mais para mostrar o último card completo
      return benefits.length - 1
    }
    return benefits.length - visibleItems
  }

  const nextSlide = () => {
    if (currentIndex < getMaxIndex()) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setCurrentIndex(0)
    }
  }

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else {
      setCurrentIndex(getMaxIndex())
    }
  }

  // Eventos para scroll do mouse no carrossel (com debounce)
  const handleWheel = (e: WheelEvent) => {
    if (!carouselRef.current || !isCarousel || isWheelActive) return

    // Previne o scroll da página apenas se o carrossel estiver em foco
    e.preventDefault()
    
    setIsWheelActive(true)
    
    // Implementa debounce para evitar mudanças rápidas demais
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current)
    }
    
    wheelTimeoutRef.current = setTimeout(() => {
      // Determina a direção do scroll com um threshold para evitar mudanças acidentais
      const threshold = 15
      if (Math.abs(e.deltaY) > threshold) {
        if (e.deltaY > 0) {
          nextSlide()
        } else {
          prevSlide()
        }
      }
      setIsWheelActive(false)
    }, 150) // Delay para evitar múltiplas mudanças em sequência
  }

  // Eventos para mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current || !isCarousel) return
    
    setIsDragging(true)
    setStartX(e.clientX)
    setScrollLeft(currentIndex)
    
    // Altera o cursor durante o arrasto
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current || !isCarousel) return

    // Calcular a distância arrastada
    const x = e.clientX
    const distance = startX - x
    
    // Não processar movimentos muito pequenos para evitar detecção acidental
    if (Math.abs(distance) < 10) return
    
    // Determina a distância mínima para mudar de slide
    const cardWidth = carouselRef.current.offsetWidth / (isMobile && showPartial ? 1 : visibleItems)
    const moveThreshold = cardWidth * 0.2 // 20% da largura do card
    
    if (Math.abs(distance) > moveThreshold) {
      if (distance > 0 && currentIndex < getMaxIndex()) {
        setCurrentIndex(scrollLeft + 1)
        setIsDragging(false)
      } else if (distance < 0 && currentIndex > 0) {
        setCurrentIndex(scrollLeft - 1)
        setIsDragging(false)
      }
      
      // Restaura o cursor
      if (carouselRef.current) {
        carouselRef.current.style.cursor = 'grab'
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    // Restaura o cursor
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grab'
    }
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      // Restaura o cursor
      if (carouselRef.current) {
        carouselRef.current.style.cursor = 'grab'
      }
    }
  }

  // Eventos para touch no carrossel
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current || !isCarousel) return

    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setScrollLeft(currentIndex)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current || !isCarousel) return

    const x = e.touches[0].clientX
    const distance = startX - x
    
    // Não processar movimentos muito pequenos
    if (Math.abs(distance) < 10) return
    
    // Determina a distância mínima para mudar de slide
    const cardWidth = carouselRef.current.offsetWidth / (isMobile && showPartial ? 1 : visibleItems)
    const moveThreshold = cardWidth * 0.2 // 20% da largura do card
    
    if (Math.abs(distance) > moveThreshold) {
      if (distance > 0 && currentIndex < getMaxIndex()) {
        setCurrentIndex(scrollLeft + 1)
        setIsDragging(false)
      } else if (distance < 0 && currentIndex > 0) {
        setCurrentIndex(scrollLeft - 1)
        setIsDragging(false)
      }
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Adiciona event listener para o wheel event
  useEffect(() => {
    const carousel = carouselRef.current
    if (carousel && isCarousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        carousel.removeEventListener('wheel', handleWheel)
        // Limpa o timeout no cleanup para evitar memory leaks
        if (wheelTimeoutRef.current) {
          clearTimeout(wheelTimeoutRef.current)
        }
      }
    }
  }, [carouselRef, currentIndex, isCarousel, isWheelActive])

  return (
    <section className="py-12 px-4 md:px-8 lg:px-16 bg-zinc-950" id="benefits">
      {/* Título da seção */}
      <h2 className="px-2 py-1 max-md:w-[90%] lg:w-[70%] mx-auto font-bold line-height-3 max-sm:text-xl md:text-3xl lg:text-3xl mb-1 text-center text-zinc-100">
        <span className="px-2 py-1 text-zinc-500">Algumas vantagens</span> de ser assinante do Clube Não Tem Chef
      </h2>
      
      {isCarousel ? (
        <div className="relative max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={prevSlide}
              className="p-2 rounded-full bg-zinc-800 text-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextSlide}
              className="p-2 rounded-full bg-zinc-800 text-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          <div 
            ref={carouselRef}
            className="overflow-hidden cursor-grab touch-pan-y"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: getTransformValue() }}
            >
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="px-2 flex-shrink-0"
                  style={{ width: `${getCardWidth()}%` }}
                >
                  <BenefitCardWithImage benefit={benefit} index={index} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Indicadores */}
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: getMaxIndex() + 1 }).map((_, index) => (
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
    <div>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="rounded-xl p-6 flex items-start "
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
    <div className="">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="bg-zinc-100 rounded-xl overflow-hidden h-full flex flex-col"
      >
        <div
          className="relative aspect-video w-full bg-cover bg-center flex flex-col justify-end h-[400px]"
          style={{ backgroundImage: `url(${benefit.image})` }}
        >
          <div className="px-6 py-4 bg-white/90 backdrop-blur-sm rounded-xl mx-2 mb-2">
            <h3 className="text-lg font-medium mb-2 text-zinc-800 leading-tight">{benefit.title}</h3>
            <p className="text-gray-500 text-sm">{benefit.description}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
