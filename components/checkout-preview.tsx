"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import Image from "next/image"

interface PartnerLink {
  id: string
  partnerId: string
  partnerName: string
  planName: string
  description: string
  priceId: string
  price: number
  interval: string
  intervalCount: number
  code: string
  lastlinkUrl?: string // URL para o checkout da Lastlink
  checkoutType?: 'stripe' | 'lastlink' // Tipo de checkout
}

export function CheckoutPreview({ partnerLink }: { partnerLink: PartnerLink }) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [partnerData, setPartnerData] = useState<any>(null)
  
  useEffect(() => {
    // Buscar informações do parceiro para saber o tipo de checkout
    const fetchPartnerData = async () => {
      try {
        if (partnerLink.partnerId) {
          const response = await fetch(`/api/users/${partnerLink.partnerId}`)
          if (response.ok) {
            const data = await response.json()
            
            // Se for link Lastlink, verificar se tem preço e outras informações úteis
            if (partnerLink.priceId?.startsWith('lastlink_') || partnerLink.checkoutType === 'lastlink') {
              console.log('Link Lastlink detectado, verificando preço:', partnerLink)
              
              // Se o link não tem preço, mas o plano sim, usar o preço do plano
              if (!partnerLink.price || partnerLink.price === 0) {
                console.log('Link sem preço definido, buscando preço no plano...')
                
                // Buscar plano correspondente
                if (data.checkoutOptions?.lastlinkPlans) {
                  const planNameFromId = partnerLink.priceId?.replace('lastlink_', '').replace(/_/g, ' ')
                  const planMatch = data.checkoutOptions.lastlinkPlans.find(
                    (plan: any) => {
                      const planNameLower = plan.name.toLowerCase()
                      const searchNameLower = planNameFromId?.toLowerCase() || ''
                      return planNameLower === searchNameLower || 
                             planNameLower.includes(searchNameLower) || 
                             searchNameLower.includes(planNameLower)
                    }
                  )
                  
                  if (planMatch && planMatch.price) {
                    console.log('Plano encontrado com preço:', planMatch.price)
                    data.linkPrice = planMatch.price
                    data.linkInterval = planMatch.interval || partnerLink.interval
                  }
                }
              }
            }
            
            setPartnerData(data)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados do parceiro:", error)
      }
    }
    
    fetchPartnerData()
  }, [partnerLink.partnerId, partnerLink.priceId, partnerLink.checkoutType, partnerLink.price])

  // Função para calcular o valor da parcela
  const calculateInstallment = () => {
    // Usar o preço do plano Lastlink se disponível
    const price = partnerData?.linkPrice || partnerLink.price
    console.log('Calculando valor da parcela:', { 
      linkPrice: partnerData?.linkPrice, 
      partnerLinkPrice: partnerLink.price, 
      finalPrice: price 
    })

    switch (partnerLink.interval) {
      case 'year':
        return price / 12
      case 'semester':
        return price / 6
      case 'quarter':
        return price / 3
      default:
        return price
    }
  }

  // Função para obter o preço total do plano
  const getTotalPrice = () => {
    // Usar o preço do plano Lastlink se disponível
    const price = partnerData?.linkPrice || partnerLink.price
    console.log('Calculando preço total:', { 
      linkPrice: partnerData?.linkPrice, 
      partnerLinkPrice: partnerLink.price,
      finalPrice: price
    })
    return price
  }

  // Função para obter o texto do período
  const getIntervalText = () => {
    switch (partnerLink.interval) {
      case 'year':
        return 'anual'
      case 'semester':
        return 'semestral'
      case 'quarter':
        return 'trimestral'
      default:
        return 'mensal'
    }
  }

  // Função para obter o número de parcelas
  const getInstallments = () => {
    switch (partnerLink.interval) {
      case 'year':
        return 12
      case 'semester':
        return 6
      case 'quarter':
        return 3
      default:
        return 1
    }
  }

  // Verificar se o checkout é Lastlink
  const isLastlinkCheckout = () => {
    // Verificar se o priceId começa com "lastlink_" ou se o checkoutType é explicitamente 'lastlink'
    if (partnerLink.checkoutType === 'lastlink') return true
    if (partnerLink.priceId?.startsWith('lastlink_')) return true
    
    // Verificar nas configurações do parceiro
    if (partnerData?.checkoutOptions) {
      // Se apenas Lastlink estiver habilitado
      if (partnerData.checkoutOptions.lastlinkEnabled && !partnerData.checkoutOptions.stripeEnabled) {
        return true
      }
      
      // Se ambos estiverem habilitados, verifique se o priceId corresponde a um plano Lastlink
      if (partnerData.checkoutOptions.lastlinkEnabled) {
        const lastlinkPlanNames = partnerData.checkoutOptions.lastlinkPlans.map((plan: any) => 
          `lastlink_${plan.name.replace(/\s/g, '_').toLowerCase()}`
        )
        return lastlinkPlanNames.includes(partnerLink.priceId)
      }
    }
    
    return false
  }
  
  // Função para obter a URL do Lastlink para o plano específico
  const getLastlinkUrl = () => {
    console.log('Buscando URL da Lastlink para o plano:', partnerLink)

    // Se a URL estiver diretamente no partnerLink, usá-la preferencialmente
    if (partnerLink.lastlinkUrl && partnerLink.lastlinkUrl.includes('lastlink.com')) {
      console.log('Usando URL direta do partnerLink:', partnerLink.lastlinkUrl)
      return partnerLink.lastlinkUrl
    }
    
    // Tentar buscar com base no ID de referência do link
    if (partnerData?.checkoutOptions?.lastlinkPlans && partnerLink.id) {
      // Verificar se temos um plano vinculado diretamente a este ID de link
      const linkedPlan = partnerData.checkoutOptions.lastlinkPlans.find(
        (plan: any) => plan.linkedLinkIds && plan.linkedLinkIds.includes(partnerLink.id)
      )
      
      if (linkedPlan) {
        console.log('Encontrado plano vinculado ao ID do link:', linkedPlan.link)
        
        // Se o plano tem preço definido e o link não, atualizamos o preço do link
        if (linkedPlan.price && !partnerLink.price) {
          console.log('Atualizando preço do link com valor do plano:', linkedPlan.price)
          // Não podemos modificar partnerLink diretamente, mas podemos notificar para fins de exibição
          setPartnerData((prev: any) => {
            if (prev) {
              return {
                ...prev,
                linkPrice: linkedPlan.price,
                linkInterval: linkedPlan.interval || partnerLink.interval
              }
            }
            return prev
          })
        }
        
        return linkedPlan.link
      }
    }
    
    // Buscar a URL nas configurações do parceiro baseado no priceId
    if (partnerData?.checkoutOptions?.lastlinkPlans && partnerLink.priceId) {
      // Extrair o nome do plano do priceId (lastlink_nome_do_plano)
      const planNameFromId = partnerLink.priceId?.replace('lastlink_', '').replace(/_/g, ' ')
      
      console.log('Buscando plano pelo nome:', planNameFromId)
      
      // Encontrar o plano correspondente (comparação mais flexível)
      const plan = partnerData.checkoutOptions.lastlinkPlans.find(
        (plan: any) => {
          // Verificar por nome exato, nome em lowercase, ou parte do nome
          const planNameLower = plan.name.toLowerCase()
          const searchNameLower = planNameFromId.toLowerCase()
          return planNameLower === searchNameLower || 
                 planNameLower.includes(searchNameLower) || 
                 searchNameLower.includes(planNameLower)
        }
      )
      
      if (plan && plan.link) {
        console.log('Plano encontrado por correspondência de nome:', plan.name, plan.link)
        
        // Se o plano tem preço definido e o link não, atualizamos o preço do link
        if (plan.price && !partnerLink.price) {
          console.log('Atualizando preço do link com valor do plano:', plan.price)
          // Armazenar informações do plano encontrado para uso nos cálculos
          setPartnerData((prev: any) => {
            if (prev) {
              return {
                ...prev,
                linkPrice: plan.price,
                linkInterval: plan.interval || partnerLink.interval
              }
            }
            return prev
          })
        }
        
        return plan.link
      }
    }
    
    // Último recurso: usar o primeiro plano disponível
    if (partnerData?.checkoutOptions?.lastlinkPlans && partnerData.checkoutOptions.lastlinkPlans.length > 0) {
      const firstPlan = partnerData.checkoutOptions.lastlinkPlans[0]
      console.log('Nenhum plano específico encontrado, usando o primeiro disponível:', firstPlan.name, firstPlan.link)
      
      // Se o plano tem preço definido, usá-lo
      if (firstPlan.price && !partnerLink.price) {
        console.log('Atualizando preço do link com valor do primeiro plano:', firstPlan.price)
        setPartnerData((prev: any) => {
          if (prev) {
            return {
              ...prev,
              linkPrice: firstPlan.price,
              linkInterval: firstPlan.interval || partnerLink.interval
            }
          }
          return prev
        })
      }
      
      return firstPlan.link
    }
    
    // Se tudo falhar, usar um link de backup (se existir na configuração)
    if (partnerData?.checkoutOptions?.defaultLastlinkUrl) {
      console.log('Usando URL de fallback:', partnerData.checkoutOptions.defaultLastlinkUrl)
      return partnerData.checkoutOptions.defaultLastlinkUrl
    }
    
    console.log('Nenhuma URL de Lastlink encontrada')
    return null
  }

  // Função para criar a sessão do Stripe para usuários logados
  const createCheckoutSession = async () => {
    try {
      setLoading(true)
      
      // Tentar diferentes opções de tokens
      const sessionToken = localStorage.getItem("session_token") || 
                           localStorage.getItem("sessionToken") || 
                           localStorage.getItem("authToken")
      
      // Log para diagnóstico
      console.log("Token encontrado:", sessionToken ? "Sim (comprimento: " + sessionToken.length + ")" : "Não")
      
      // Obter dados do usuário do contexto de autenticação
      const userData = {
        userId: user?.uid,
        email: user?.email,
        displayName: user?.displayName
      }
      
      console.log("Dados do usuário:", userData)
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken || ""}`,
          'x-session-token': sessionToken || ""
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: userData.userId,
          email: userData.email,
          priceId: partnerLink.priceId,
          partnerId: partnerLink.partnerId,
          partnerLinkId: partnerLink.id,
          isAuthenticated: true,
          // Incluir dados adicionais que possam ser úteis
          userInfo: {
            displayName: userData.displayName,
            email: userData.email
          }
        })
      })

      // Log para status da resposta
      console.log("Status da resposta:", response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erro na resposta:", errorData)
        throw new Error(errorData.message || 'Erro ao criar sessão de checkout')
      }

      const { url } = await response.json()
      console.log("URL de redirecionamento:", url ? "Recebida" : "Não encontrada")
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('URL de checkout não encontrada')
      }
    } catch (error: any) {
      console.error('Erro ao criar sessão de checkout:', error)
      toast.error(error.message || 'Erro ao processar o checkout')
    } finally {
      setLoading(false)
    }
  }

  const handleLastlinkCheckout = () => {
    // Extrair parâmetros UTM da URL atual para preservá-los
    const currentUtmParams: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      ['utm_source', 'utm_medium', 'utm_content', 'utm_term', 'utm_campaign'].forEach(param => {
        const value = urlParams.get(param);
        if (value) currentUtmParams[param] = value;
      });
    }
    console.log('Parâmetros UTM detectados na URL atual:', currentUtmParams);

    // Salvar dados para uso após o registro, se necessário
    const checkoutData = {
      priceId: partnerLink.priceId,
      partnerId: partnerLink.partnerId,
      partnerLinkId: partnerLink.id,
      planName: partnerLink.planName,
      price: partnerLink.price,
      interval: partnerLink.interval,
      checkoutType: 'lastlink',
      timestamp: new Date().toISOString(),
      utmParams: currentUtmParams // Salvar UTMs atuais
    }
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData))
    
    // Se o usuário já estiver logado, redirecionar para o lastlink
    if (user && user.uid && user.userType === 'member') {
      // Verificar se temos o link direto ou precisamos buscar
      const lastlinkUrl = getLastlinkUrl()
      
      if (lastlinkUrl) {
        // Preparar URL com metadados e callback
        const baseUrl = lastlinkUrl
        
        // Construir a URL de callback com os parâmetros necessários
        const baseCallbackUrl = `${window.location.origin}/success`
        const callbackUrlParams = new URLSearchParams()
        
        // Adicionar parâmetros importantes na URL de callback
        callbackUrlParams.append('userId', user.uid)
        callbackUrlParams.append('partnerId', partnerLink.partnerId)
        callbackUrlParams.append('partnerLinkId', partnerLink.id)
        
        // Adicionar parâmetros UTM ao callback se existirem
        Object.entries(currentUtmParams).forEach(([key, value]) => {
          callbackUrlParams.append(key, value as string)
        })
        
        // URL de callback final
        const callbackUrl = `${baseCallbackUrl}?${callbackUrlParams.toString()}`
        console.log('URL de callback configurada:', callbackUrl)
        
        // Construir a URL com parâmetros
        const url = new URL(baseUrl)
        
        // Adicionar metadados - Lastlink não processa corretamente, mas tentamos mesmo assim
        url.searchParams.append('metadata[userId]', user.uid)
        url.searchParams.append('metadata[partnerId]', partnerLink.partnerId)
        url.searchParams.append('metadata[partnerLinkId]', partnerLink.id)
        url.searchParams.append('metadata[source]', 'ntc_platform')
        
        // Adicionar informações do usuário se disponíveis
        if (user.email) url.searchParams.append('email', user.email)
        if (user.displayName) url.searchParams.append('name', user.displayName)
        
        // Adicionar URL de callback e sucesso
        url.searchParams.append('callback_url', `${window.location.origin}/api/lastlink/callback`)
        url.searchParams.append('success_url', callbackUrl)
        
        // Priorizar UTMs da URL atual, caso existam
        const appName = process.env.NEXT_PUBLIC_APP_PROJECTNAME || 'naotemchef'
        const partnerName = partnerLink.partnerName?.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/,/g, '.') || 'parceiro'
        const linkName = partnerLink.planName?.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/,/g, '.') || 'link'
        const linkPrice = partnerLink.price.toString().replace(',', '.')
        
        // Usar UTMs da URL atual ou gerar novos
        url.searchParams.append('utm_source', (currentUtmParams['utm_source'] as string) || appName)
        url.searchParams.append('utm_medium', (currentUtmParams['utm_medium'] as string) || partnerName)
        url.searchParams.append('utm_content', (currentUtmParams['utm_content'] as string) || linkName)
        url.searchParams.append('utm_term', (currentUtmParams['utm_term'] as string) || linkPrice)
        url.searchParams.append('utm_campaign', (currentUtmParams['utm_campaign'] as string) || `${appName}_${partnerName}_${linkName}_${linkPrice}`)
        
        // Salvar informações na localStorage para uso quando o usuário retornar
        const lastlinkCheckoutData = {
          userId: user.uid,
          partnerId: partnerLink.partnerId,
          partnerLinkId: partnerLink.id,
          partnerName: partnerLink.partnerName,
          planName: partnerLink.planName,
          price: partnerLink.price,
          interval: partnerLink.interval,
          lastlinkUrl: lastlinkUrl, // Salvar a URL usada
          timestamp: new Date().toISOString(),
          
          // Salvar também os UTMs (priorizar os da URL atual)
          utm_source: (currentUtmParams['utm_source'] as string) || appName,
          utm_medium: (currentUtmParams['utm_medium'] as string) || partnerName,
          utm_content: (currentUtmParams['utm_content'] as string) || linkName,
          utm_term: (currentUtmParams['utm_term'] as string) || linkPrice,
          utm_campaign: (currentUtmParams['utm_campaign'] as string) || `${appName}_${partnerName}_${linkName}_${linkPrice}`
        }
        localStorage.setItem('lastlink_checkout_data', JSON.stringify(lastlinkCheckoutData))
        
        console.log('Redirecionando para Lastlink com URL:', lastlinkUrl)
        console.log('URL completa com parâmetros:', url.toString())
        console.log('Dados salvos na localStorage para uso após o pagamento:', lastlinkCheckoutData)
        
        window.location.href = url.toString()
      } else {
        toast.error('URL de checkout não encontrada')
      }
      return
    }
    
    // Se não estiver logado, redirecionar para registro
    // Extrair parâmetros UTM da URL atual, se existirem
    const registrationParams = new URLSearchParams()
    registrationParams.append('redirect', 'onboarding')
    registrationParams.append('partnerId', partnerLink.partnerId)
    registrationParams.append('ref', partnerLink.id)
    registrationParams.append('checkout', 'lastlink')
    
    // Priorizar UTMs da URL atual, caso existam
    const appName = process.env.NEXT_PUBLIC_APP_PROJECTNAME || 'naotemchef'
    const partnerName = partnerLink.partnerName?.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/,/g, '.') || 'parceiro'
    const linkName = partnerLink.planName?.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/,/g, '.') || 'link'
    const linkPrice = partnerLink.price.toString().replace(',', '.')
    
    // Adicionar UTMs (da URL atual ou gerados)
    registrationParams.append('utm_source', (currentUtmParams['utm_source'] as string) || appName)
    registrationParams.append('utm_medium', (currentUtmParams['utm_medium'] as string) || partnerName)
    registrationParams.append('utm_content', (currentUtmParams['utm_content'] as string) || linkName)
    registrationParams.append('utm_term', (currentUtmParams['utm_term'] as string) || linkPrice)
    registrationParams.append('utm_campaign', (currentUtmParams['utm_campaign'] as string) || `${appName}_${partnerName}_${linkName}_${linkPrice}`)
    
    router.push(`/auth/register?${registrationParams.toString()}`)
  }

  const handleStartOnboarding = () => {
    // Verificar se é checkout da Lastlink
    if (isLastlinkCheckout()) {
      handleLastlinkCheckout()
      return
    }
    
    // Se for checkout do Stripe
    // Se o usuário já estiver logado, criar a sessão do Stripe diretamente
    if (user && user.uid && user.userType === 'member') {
      createCheckoutSession()
      return
    }
    
    // Caso contrário, seguir o fluxo atual (salvar dados e redirecionar para registro)
    const checkoutData = {
      priceId: partnerLink.priceId,
      partnerId: partnerLink.partnerId,
      partnerLinkId: partnerLink.id,
      planName: partnerLink.planName,
      price: partnerLink.price,
      interval: partnerLink.interval,
      checkoutType: 'stripe'
    }
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData))
    
    // Redirecionar para a página de registro
    router.push(`/auth/register?redirect=onboarding&partnerId=${partnerLink.partnerId}&ref=${partnerLink.id}`)
  }

  return (
    <div className="p-8">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-white shadow-lg border-4 border-zinc-100">
          <Image
            src="/logo.svg"
            alt="Logo"
            fill
            className="object-contain p-6"
            priority
          />
        </div>
      </div>

      {/* Detalhes do Plano */}
      <div className="text-center space-y-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-600 mb-2">
            {partnerLink.planName}
          </h2>
          <p className="text-zinc-400">
            {partnerLink.description}
          </p>
        </div>

        {/* Preços */}
        <div className="bg-zinc-50 rounded-xl p-6">
          <div className="space-y-2">
            {/* Valor da parcela */}
            {/* Só exibe se for plano mensal */}
            {partnerLink.interval == 'month' && (
            <p className="text-4xl font-bold text-orange-600">
              R$ {calculateInstallment().toFixed(2)}
              <span className="text-base font-normal text-zinc-600">/mês</span>
            </p>
             )}
             
            {/* Valor total e período - só exibe se não for plano mensal */}
            {partnerLink.interval !== 'month' && (
              <div className="text-sm text-zinc-500">
                <p className="text-4xl font-bold text-purple-600">
                  <span className="text-base font-normal text-zinc-600">{getInstallments()}x de </span>R$ {calculateInstallment().toFixed(2)} <span className="text-base font-normal text-zinc-600">/mês</span>
                </p>
                <p>
                  Valor total: R$ {getTotalPrice().toFixed(2)}
                </p>
                <p>Cobrança {getIntervalText()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Benefícios */}
      <div className="space-y-3 mb-8">
        {[
          'Acesso a todos os cupons de desconto',
          'Economize em seus estabelecimentos favoritos',
          'Suporte prioritário',
          'Atualizações em tempo real'
        ].map((benefit) => (
          <div key={benefit} className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
            <span className="text-zinc-600">{benefit}</span>
          </div>
        ))}
      </div>

      {/* Botão de Ação mostra mensagem diferente para usuários já logados */}
      <Button
        onClick={handleStartOnboarding}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
      >
        {loading ? 'Processando...' : user?.userType === 'member' ? 'Continuar para pagamento' : 'Quero esse plano'}
      </Button>
      
      {/* Mostrar mensagem para usuários já logados */}
      {user?.userType === 'member' && (
        <div className="mt-3 flex items-center justify-center space-x-2">
          <p className="text-sm text-zinc-500">
            Você já está logado como <b>{user.email}</b>
          </p>
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Avatar do usuário" 
              className="w-6 h-6 rounded-full object-cover border border-zinc-200"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-xs font-bold">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 