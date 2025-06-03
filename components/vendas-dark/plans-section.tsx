"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Check, Star } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { getDefaultLink } from "@/lib/firebase/partner-links"

// Interface para o link padrão
interface PartnerLink {
  id: string;
  name?: string;
  price?: number;
  lastlinkUrl?: string;
  isDefault?: boolean;
  [key: string]: any;
}

type Plan = {
  name: string;
  price: number;
  originalPrice: number;
  installments: boolean;
  installmentsCount?: number;
  features: string[];
  discountPercent?: number;
  popular: boolean;
  cta: string;
  ctaColor: string;
  period: string;
}

const plans: Plan[] = [
  {
    name: "Anual",
    price: 49.90,
    originalPrice: 99.90,
    installments: true,
    installmentsCount: 12,
    features: [
      "Acesso a todos os descontos de restaurantes",
      "Acesso à comunidade exclusiva no WhatsApp",
      "Produtos exclusivos Não Tem Chef",
      "Descontos em cursos gastronômicos",
      "Prioridade em sorteios exclusivos",
      "Acesso a eventos especiais"
    ],
    discountPercent: 50,
    popular: true,
    cta: "Assinar Agora",
    ctaColor: "#4CAF50",
    period: "ano"
  },
  {
    name: "Semestral",
    price: 69.90,
    originalPrice: 99.90,
    installments: true,
    installmentsCount: 6,
    features: [
      "Acesso a todos os descontos de restaurantes",
      "Acesso à comunidade exclusiva no WhatsApp",
      "Produtos exclusivos Não Tem Chef",
      "Descontos em cursos gastronômicos",
      "Prioridade em sorteios exclusivos",
      "Acesso a eventos especiais"
    ],
    discountPercent: 30,
    popular: false,
    cta: "Assinar Agora",
    ctaColor: "#4CAF50",
    period: "semestre"
  },
  {
    name: "Mensal",
    price: 99.90,
    originalPrice: 129.90,
    installments: false,
    features: [
      "Acesso a todos os descontos de restaurantes",
      "Acesso à comunidade exclusiva no WhatsApp",
      "Produtos exclusivos Não Tem Chef",
      "Descontos em cursos gastronômicos",
      "Prioridade em sorteios exclusivos",
      "Acesso a eventos especiais"
    ],
    popular: false,
    cta: "Assinar Agora",
    ctaColor: "#4CAF50",
    period: "mês"
  },
]

export default function PlansSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })
  
  const searchParams = useSearchParams()
  const [checkoutBaseUrl, setCheckoutBaseUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  // Buscar o link de checkout padrão quando o componente for montado
  useEffect(() => {
    const fetchDefaultLink = async () => {
      try {
        setIsLoading(true)
        const defaultLink = await getDefaultLink() as PartnerLink
        
        if (defaultLink && defaultLink.lastlinkUrl) {
          setCheckoutBaseUrl(defaultLink.lastlinkUrl)
        } else {
          // Fallback para URL padrão caso não encontre o link 
          console.warn("Link de checkout padrão não encontrado. Usando URL de fallback.")
          setCheckoutBaseUrl("https://lastlink.com/p/C4D0F7E74/checkout-payment/")
        }
      } catch (error) {
        console.error("Erro ao buscar link de checkout padrão:", error)
        // Fallback em caso de erro
        setCheckoutBaseUrl("https://lastlink.com/p/C4D0F7E74/checkout-payment/")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDefaultLink()
  }, [])
  
  // Criar URL do checkout com UTMs
  const getCheckoutUrl = () => {
    // Se ainda estiver carregando ou não tiver URL base, retorna vazio
    if (isLoading || !checkoutBaseUrl) {
      return "#"
    }
    
    // Lista de parâmetros UTM padrão
    const standardUtmParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'utm_id',
      'utm_referrer'
    ]
    
    // Capturar o parâmetro utm genérico
    const utmGeneric = searchParams.get('utm') || ''
    
    // Criar objeto URLSearchParams para a nova URL
    const params = new URLSearchParams()
    
    // Adicionar todos os parâmetros UTM existentes
    let hasUtmParams = false
    
    // Primeiro, verificar e adicionar as UTMs padrão
    standardUtmParams.forEach(param => {
      const value = searchParams.get(param)
      if (value) {
        params.append(param, value)
        hasUtmParams = true
      }
    })
    
    // Depois, adicionar quaisquer outros parâmetros que comecem com utm_
    for (const [key, value] of Array.from(searchParams.entries())) {
      if (key.startsWith('utm_') && !standardUtmParams.includes(key)) {
        params.append(key, value)
        hasUtmParams = true
      }
    }
    
    // Se houver outros parâmetros não-UTM que precisem ser preservados
    // Exemplo: params.append('ref', searchParams.get('ref') || '')
    
    // Construir a URL final
    if (hasUtmParams) {
      return `${checkoutBaseUrl}?${params.toString()}`
    } else if (utmGeneric) {
      // Se não houver UTMs específicas mas tiver o parâmetro genérico 'utm'
      return `${checkoutBaseUrl}?${utmGeneric}`
    } else {
      // Sem parâmetros UTM
      return checkoutBaseUrl
    }
  }

  return (
    <section ref={ref} className="py-16 px-4 md:px-8 lg:px-16 bg-zinc-900" id="plans">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="bg-gradient-to-r from-[#f56444] to-[#f24857] text-transparent bg-clip-text text-lg font-bold">
            Escolha o melhor plano para você
          </span>
          <h2 className="text-3xl md:text-3xl lg:text-3xl font-bold mt-2 mb-4 text-zinc-100">
            Valores exclusivos de <span className="text-zinc-500">lançamento</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className={`rounded-xl overflow-hidden relative ${
                plan.popular 
                  ? 'border-2 border-yellow-200 bg-yellow-50 transform md:scale-105 shadow-xl' 
                  : 'border border-zinc-200 bg-zinc-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-yellow-200 text-yellow-800 py-1 px-4 flex items-center rounded-bl-lg z-10 shadow-sm shadow-yellow-500/50">
                  <Star className="w-4 h-4 mr-1 fill-white" />
                  <span className="text-sm font-bold">Mais vantajoso</span>
                </div>
              )}
              
              <div className="p-6 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-3xl font-bold mb-6 text-zinc-800">{plan.name}</h3>
                  
                  {plan.discountPercent && (
                    <div className="inline-block bg-green-500/20 text-green-600 text-xs font-bold px-2 py-1 rounded-full mb-2">
                      Economize {plan.discountPercent}%
                    </div>
                  )}
                
                  {plan.installments && plan.installmentsCount ? (
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-zinc-400 text-sm mr-1">De</span>
                        <span className="text-zinc-400 text-lg line-through mr-1">
                          R${plan.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-zinc-400 text-sm">por</span>
                      </div>
                      <div className="text-3xl md:text-3xl font-semibold mt-1 text-zinc-600">
                        {plan.installmentsCount}x R${plan.price.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-zinc-400 text-sm mt-1">
                        ou R${(plan.price * plan.installmentsCount).toFixed(2).replace('.', ',')} à vista
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-zinc-600 text-sm mr-1">De</span>
                        <span className="text-zinc-600 text-lg line-through mr-1">
                          R${plan.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="text-3xl md:text-3xl font-semibold mt-1 text-zinc-600">
                        R${plan.price.toFixed(2).replace('.', ',')}
                        <span className="text-sm text-zinc-600">/{plan.period}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-6">
                    <h4 className="font-semibold mb-4 text-zinc-600">O que está incluído:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="w-4 h-4 text-[#4CAF50] mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-500 text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                    <a
                      href={getCheckoutUrl()}
                      target="_blank"
                    rel="noreferrer"
                    style={{ backgroundColor: plan.ctaColor }}
                    className="block w-full py-3 px-6 rounded-xl text-white text-center font-bold text-lg transition-transform hover:scale-105"
                  >
                    {plan.cta}
                  </a>
                </div>
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
          <p className="text-lg text-zinc-400">
            Sem fidelidade! Cancele quando quiser. Nós garantimos reembolso em até 7 dias.
          </p>
        </motion.div>
      </div>
    </section>
  )
} 