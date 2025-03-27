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
            setPartnerData(data)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados do parceiro:", error)
      }
    }
    
    fetchPartnerData()
  }, [partnerLink.partnerId])

  // Função para calcular o valor da parcela
  const calculateInstallment = () => {
    switch (partnerLink.interval) {
      case 'year':
        return partnerLink.price / 12
      case 'semester':
        return partnerLink.price / 6
      case 'quarter':
        return partnerLink.price / 3
      default:
        return partnerLink.price
    }
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
    // Se a URL estiver diretamente no partnerLink
    if (partnerLink.lastlinkUrl) return partnerLink.lastlinkUrl
    
    // Buscar a URL nas configurações do parceiro
    if (partnerData?.checkoutOptions?.lastlinkPlans) {
      // Extrair o nome do plano do priceId (lastlink_nome_do_plano)
      const planNameFromId = partnerLink.priceId?.replace('lastlink_', '').replace(/_/g, ' ')
      
      // Encontrar o plano correspondente
      const plan = partnerData.checkoutOptions.lastlinkPlans.find(
        (plan: any) => plan.name.toLowerCase() === planNameFromId
      )
      
      if (plan) return plan.link
    }
    
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
    // Salvar dados para uso após o registro, se necessário
    const checkoutData = {
      priceId: partnerLink.priceId,
      partnerId: partnerLink.partnerId,
      partnerLinkId: partnerLink.id,
      planName: partnerLink.planName,
      price: partnerLink.price,
      interval: partnerLink.interval,
      checkoutType: 'lastlink'
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
        const baseCallbackUrl = `${window.location.origin}/api/lastlink/callback`
        const callbackUrlParams = new URLSearchParams()
        
        // Adicionar parâmetros importantes na URL de callback
        callbackUrlParams.append('userId', user.uid)
        callbackUrlParams.append('partnerId', partnerLink.partnerId)
        callbackUrlParams.append('partnerLinkId', partnerLink.id)
        
        // URL de callback final
        const callbackUrl = `${baseCallbackUrl}?${callbackUrlParams.toString()}`
        console.log('URL de callback configurada:', callbackUrl)
        
        // Construir a URL com parâmetros
        const url = new URL(baseUrl)
        
        // Adicionar metadados
        url.searchParams.append('metadata[userId]', user.uid)
        url.searchParams.append('metadata[partnerId]', partnerLink.partnerId)
        url.searchParams.append('metadata[partnerLinkId]', partnerLink.id)
        
        // Adicionar informações do usuário se disponíveis
        if (user.email) url.searchParams.append('email', user.email)
        if (user.displayName) url.searchParams.append('name', user.displayName)
        
        // Adicionar callback URL
        url.searchParams.append('callback_url', callbackUrl)
        
        // Salvar informações na localStorage para uso quando o usuário retornar
        const lastlinkCheckoutData = {
          userId: user.uid,
          partnerId: partnerLink.partnerId,
          partnerLinkId: partnerLink.id,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem('lastlink_checkout_data', JSON.stringify(lastlinkCheckoutData))
        
        console.log('Redirecionando para Lastlink com metadados:', url.toString())
        console.log('Dados salvos na localStorage para uso após o pagamento')
        
        window.location.href = url.toString()
      } else {
        toast.error('URL de checkout não encontrada')
      }
      return
    }
    
    // Se não estiver logado, redirecionar para registro
    router.push(`/auth/register?redirect=onboarding&partnerId=${partnerLink.partnerId}&ref=${partnerLink.id}&checkout=lastlink`)
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
                  Valor total: R$ {partnerLink.price.toFixed(2)}
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