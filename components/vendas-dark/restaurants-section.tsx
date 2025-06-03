"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react"

// Interface para restaurantes
interface Restaurant {
  id: string;
  name: string;
  images: string[];
  discountvalue?: number;
  type?: {
    type?: string;
    category?: string;
  };
  address?: {
    city?: string;
  };
}

// Interface para grupos de categoria
interface CategoryGroup {
  category: string;
  restaurants: Restaurant[];
}

export default function RestaurantsSection() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })
  
  // Ref para cada carrossel por categoria
  const carouselRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Buscar restaurantes da API
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true)
        console.log("Iniciando busca de restaurantes da API pública...")
        
        // Usando a rota pública para acessar os restaurantes
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout
        
        console.log("Fazendo requisição para /api/public/restaurants")
        const response = await fetch("/api/public/restaurants", {
          signal: controller.signal,
          cache: 'no-store'
        })
        
        clearTimeout(timeoutId)
        
        console.log("Status da resposta:", response.status, response.statusText)
        
        if (!response.ok) {
          console.error("Erro na resposta:", response.status, response.statusText)
          const errorText = await response.text().catch(() => "Não foi possível ler o corpo da resposta")
          console.error("Corpo da resposta de erro:", errorText)
          throw new Error(`Erro ao carregar restaurantes: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log("Dados recebidos da API:", Object.keys(data))
        
        if (data.establishments && Array.isArray(data.establishments)) {
          console.log(`Recebidos ${data.establishments.length} restaurantes da API`)
          
          if (data.establishments.length === 0) {
            console.warn("API retornou array vazio de estabelecimentos")
            throw new Error("Nenhum restaurante encontrado")
          }
          
          // Processamento dos estabelecimentos
          const processedRestaurants = data.establishments.map((est: any) => {
            console.log("API est.discountvalue:", est.discountvalue, "Type:", typeof est.discountvalue);
            return {
              id: est.id || `fallback-${Math.random().toString(36).substring(2, 9)}`,
              name: est.name || "Restaurante sem nome",
              images: Array.isArray(est.images) && est.images.length > 0 
                ? est.images 
                : ["/homepage/tipos-restaurantes/mais.jpg"],
              type: est.type || { type: "Tipo não informado", category: "Categoria não informada" },
              address: est.address || { city: "Cidade não informada" },
              discountvalue: est.discountvalue || 0
            }
          })
          
          console.log("Restaurantes processados com sucesso:", processedRestaurants.length)
          setRestaurants(processedRestaurants)
        } else {
          console.warn("Formato de dados inesperado:", data)
          throw new Error("Formato de dados inválido")
        }
      } catch (error) {
        console.error("Erro ao carregar restaurantes:", error instanceof Error ? error.message : String(error))
        console.log("Usando dados fictícios como fallback...")
        
        // Em caso de erro, usar dados fictícios para demonstração
        const fallbackData = getFallbackRestaurants()
        setRestaurants(fallbackData)
        console.log(`Carregados ${fallbackData.length} restaurantes fictícios como fallback`)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRestaurants()
  }, [])
  
  // Função para agrupar restaurantes por categoria
  const groupRestaurantsByCategory = (restaurants: Restaurant[]): CategoryGroup[] => {
    const groupedMap = new Map<string, Restaurant[]>()
    
    restaurants.forEach(restaurant => {
      const category = restaurant.type?.category || "Outros"
      
      if (!groupedMap.has(category)) {
        groupedMap.set(category, [])
      }
      
      groupedMap.get(category)!.push(restaurant)
    })
    
    // Converter o mapa em array de CategoryGroup
    const result: CategoryGroup[] = []
    groupedMap.forEach((restaurants, category) => {
      result.push({
        category,
        restaurants
      })
    })
    
    // Ordenar categorias por número de restaurantes (decrescente)
    return result.sort((a, b) => b.restaurants.length - a.restaurants.length)
  }
  
  // Restaurantes agrupados por categoria
  const categorizedRestaurants = groupRestaurantsByCategory(restaurants)
  
  // Função para navegar no carrossel
  const scrollCarousel = (categoryId: string, direction: 'left' | 'right') => {
    const container = carouselRefs.current.get(categoryId)
    if (!container) return
    
    const scrollAmount = container.clientWidth * 0.8
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }
  
  // Função para obter restaurantes fictícios caso a API falhe
  const getFallbackRestaurants = (): Restaurant[] => {
    // Criar array para armazenar os restaurantes ficticios
    const fallbackRestaurants: Restaurant[] = []
    
    // Categorias de exemplo
    const categories = ["Italiano", "Japonês", "Hamburguerias", "Pizzarias", "Botecos", "Francês", "Árabe", "Brasileiro"]
    
    // Para cada categoria, criar 2-3 restaurantes
    categories.forEach((category, idx) => {
      const count = Math.floor(Math.random() * 2) + 2 // 2 a 3 restaurantes por categoria
      
      for (let i = 1; i <= count; i++) {
        const imageIndex = (idx % 7) + 1 // Ciclar entre as imagens disponíveis
        fallbackRestaurants.push({
          id: `${idx}-${i}`,
          name: `${getRestaurantNameForCategory(category)} ${i}`,
          images: [`/homepage/tipos-restaurantes/${getImageNameForCategory(category)}`],
          type: { category: category, type: getCategoryType(category) },
          address: { city: getCityForIndex(idx % 5) }
        })
      }
    })
    
    return fallbackRestaurants
  }
  
  // Funções auxiliares para gerar dados fictícios mais realistas
  const getRestaurantNameForCategory = (category: string): string => {
    const nameMap: {[key: string]: string[]} = {
      "Italiano": ["Trattoria", "Cantina", "Osteria", "Ristorante"],
      "Japonês": ["Sushi", "Temaki", "Sakura", "Tokyo"],
      "Hamburguerias": ["Burger", "Smash", "Grill", "BBQ"],
      "Pizzarias": ["Pizzaria", "Pizza Express", "Forno a Lenha", "La Pizza"],
      "Botecos": ["Bar do", "Boteco", "Petisco", "Chopp"],
      "Francês": ["Le Bistro", "Café", "Patisserie", "Boulangerie"],
      "Árabe": ["Shawarma", "Kebab", "Mediterrâneo", "Aladdin"],
      "Brasileiro": ["Sabor", "Feijão", "Tempero", "Bistrô"]
    }
    
    const names = nameMap[category] || ["Restaurante"]
    return names[Math.floor(Math.random() * names.length)]
  }
  
  const getImageNameForCategory = (category: string): string => {
    const imageMap: {[key: string]: string} = {
      "Italiano": "italiano.jpg",
      "Japonês": "japones.jpg",
      "Hamburguerias": "hamburgueria.jpg",
      "Pizzarias": "pizzaria.jpg",
      "Botecos": "boteco.jpg",
      "Francês": "frances.jpg",
      "Árabe": "arabe.jpg",
      "Brasileiro": "brasileiro.jpg"
    }
    
    return imageMap[category] || "mais.jpg"
  }
  
  const getCategoryType = (category: string): string => {
    const typeMap: {[key: string]: string} = {
      "Italiano": "Restaurante Italiano",
      "Japonês": "Restaurante Japonês",
      "Hamburguerias": "Fast Food",
      "Pizzarias": "Pizzaria",
      "Botecos": "Bar",
      "Francês": "Restaurante Francês",
      "Árabe": "Restaurante Árabe",
      "Brasileiro": "Restaurante Brasileiro"
    }
    
    return typeMap[category] || "Restaurante"
  }
  
  const getCityForIndex = (index: number): string => {
    const cities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Brasília"]
    return cities[index]
  }
  
  // Renderizar o card do restaurante
  const renderRestaurantCard = (restaurant: Restaurant) => (
    <div key={restaurant.id} className="rounded-xl overflow-hidden group shadow-sm bg-zinc-50 border border-zinc-100 h-full flex flex-col">
      <div className="relative aspect-video">
        <Image
          src={restaurant.images[0] || "/logo.svg"}
          alt={restaurant.name}
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/logo.svg"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        {/* Valor do desconto do cupom */}
        <div className="absolute bottom-3 right-3 bg-white/90 border border-white text-black px-2 py-1 rounded-xl flex flex-row items-center font-semibold space-x-2 shadow-md shadow-black/20">
          <Ticket className="w-4 h-4 text-emerald-500" /><span className="text-emerald-500">{restaurant.discountvalue} OFF</span>
        </div>
      </div>
      <div className="p-4 space-y-1 flex-grow">
        <h3 className="font-semibold text-zinc-700">{restaurant.name}</h3>
        <div className="flex justify-between items-center">
          <p className="text-sm text-zinc-500">
            {restaurant.type?.category || "Restaurante"}
          </p>
          <p className="text-xs text-zinc-400">
            {restaurant.address?.city || "Cidade não informada"}
          </p>
        </div>
      </div>
    </div>
  )
  
  // Renderizar o carrossel por categoria
  const renderCategoryCarousel = (category: string, restaurants: Restaurant[]) => (
    <div key={category} className="mb-8 w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-zinc-400">{category}</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => scrollCarousel(category, 'left')}
            className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-500 text-zinc-800 hover:text-zinc-300"
            aria-label="Rolar para a esquerda"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={() => scrollCarousel(category, 'right')}
            className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-500 text-zinc-800 hover:text-zinc-300"
            aria-label="Rolar para a direita"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="relative -mx-4">
        <div 
          className="flex overflow-x-auto pb-4 px-4 gap-4 scrollbar-hide cursor-grab"
          ref={(el) => {
            if (el) carouselRefs.current.set(category, el);
          }}
        >
          {restaurants.map(restaurant => (
            <div 
              key={restaurant.id} 
              className="carousel-item"
              style={{
                width: 'calc(80% - 16px)',  // Mobile: 80% da largura
                maxWidth: '340px',          // Limite de largura máxima
                minWidth: '260px',          // Largura mínima
                flexShrink: 0,
              }}
            >
              {renderRestaurantCard(restaurant)}
            </div>
          ))}
          
          {/* Card "Em breve" ao final de cada categoria */}
          <div 
            className="carousel-item"
            style={{
              width: 'calc(80% - 16px)',    // Mobile: 80% da largura
              maxWidth: '340px',            // Limite de largura máxima
              minWidth: '260px',            // Largura mínima
              flexShrink: 0,
            }}
          >
            <div className="rounded-xl overflow-hidden group h-full flex flex-col">
              <div className="relative aspect-video flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl opacity-20"><Image className="grayscale" src="/logo.svg" alt="Em breve" width={100} height={100} /></span>
                </div>
              </div>
              <div className="p-4 space-y-1 flex-grow flex flex-col items-center justify-center text-center">
                <h3 className="font-semibold text-zinc-400">E vários outros em breve</h3>
                <p className="text-sm text-zinc-400">
                  Mais estabelecimentos estão chegando nesta categoria
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  
  // Renderizar skeletons durante o carregamento
  const renderSkeletons = () => (
    <div className="space-y-8 w-full">
      {[1, 2, 3].map((categoryIndex) => (
        <div key={categoryIndex} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="h-7 w-40 bg-zinc-200 rounded animate-pulse"></div>
            <div className="flex space-x-2">
              <div className="h-8 w-8 bg-zinc-200 rounded-full animate-pulse"></div>
              <div className="h-8 w-8 bg-zinc-200 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="relative -mx-4">
            <div className="flex overflow-x-auto pb-4 px-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="carousel-item" style={{ width: 'calc(80% - 16px)', flexShrink: 0 }}>
                  <div className="rounded-xl overflow-hidden shadow-sm bg-zinc-50 border border-zinc-100">
                    <div className="aspect-video bg-zinc-200 animate-pulse"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-5 bg-zinc-200 rounded w-4/5 animate-pulse"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-zinc-200 rounded w-1/3 animate-pulse"></div>
                        <div className="h-3 bg-zinc-200 rounded w-1/4 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section ref={ref} className="py-16 px-4 md:px-8 lg:px-16 w-full h-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-3xl lg:text-3xl font-bold mt-2 mb-4">
          Descubra onde você pode <span className="text-[#F24957]">economizar</span>
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Conheça os restaurantes que fazem parte do Clube Não Tem Chef e aproveite descontos exclusivos.
        </p>
      </motion.div>

      <div className="mx-auto overflow-y-auto">
        {isLoading ? (
          renderSkeletons()
        ) : (
          <>
            {categorizedRestaurants.length > 0 ? (
              categorizedRestaurants.map(group => 
                renderCategoryCarousel(group.category, group.restaurants)
              )
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-500">Nenhum restaurante encontrado.</p>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Responsividade para o carrossel */
        @media (min-width: 768px) {
          .carousel-item {
            width: calc(40% - 16px) !important;
          }
        }
        
        @media (min-width: 1024px) {
          .carousel-item {
            width: calc(25% - 16px) !important;
          }
        }
      `}</style>
    </section>
  )
} 