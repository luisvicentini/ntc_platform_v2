"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

// Componente interno que processa o sucesso do pagamento
function SuccessContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  
  // Função para extrair parâmetros da URL
  const getQueryParams = () => {
    if (typeof window === 'undefined') return {}
    
    const params = new URLSearchParams(window.location.search)
    return {
      token: params.get('token'),
      transactionId: params.get('transaction_id') || params.get('transactionId'),
      paymentId: params.get('payment_id') || params.get('paymentId'),
      orderId: params.get('order_id') || params.get('orderId'),
      paymentMethod: params.get('paymentMethod'),
      userId: params.get('userId'),
      partnerId: params.get('partnerId'),
      partnerLinkId: params.get('partnerLinkId')
    }
  }
  
  // Função para obter dados do localStorage
  const getStoredData = () => {
    if (typeof window === 'undefined') return null
    
    try {
      const lastlinkData = localStorage.getItem('lastlink_checkout_data')
      return lastlinkData ? JSON.parse(lastlinkData) : null
    } catch (e) {
      console.error('Erro ao recuperar dados do localStorage:', e)
      return null
    }
  }
  
  // Função para salvar informações de parceiro para webhook
  const savePendingSubscription = async (data: {
    userId?: string;
    userEmail?: string;
    partnerId?: string;
    partnerLinkId?: string;
    token?: string;
  }) => {
    try {
      if (!data.userId && !data.userEmail) {
        console.error('Dados insuficientes para salvar assinatura pendente')
        return null
      }
      
      // Garantir que temos pelo menos um ID de parceiro
      if (!data.partnerId) {
        console.error('ID do parceiro é obrigatório para salvar assinatura pendente')
        return null
      }
      
      const response = await fetch('/api/pending-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          // Adicionar data de expiração (1 hora a partir de agora)
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Erro ao salvar dados pendentes:', errorData)
        return null
      }
      
      const responseData = await response.json()
      console.log('Dados pendentes salvos com sucesso:', responseData)
      return responseData.id
    } catch (error) {
      console.error('Erro ao salvar dados pendentes:', error)
      return null
    }
  }
  
  // Função para enviar email de ativação
  const sendActivationEmail = async (email: string, name?: string) => {
    try {
      const response = await fetch('/api/account-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao enviar email de ativação')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao enviar email de ativação:', error)
      throw error
    }
  }
  
  // Função para processar o pagamento
  const processPayment = async () => {
    try {
      setProcessingPayment(true)
      
      // Obter parâmetros da URL
      const urlParams = getQueryParams()
      
      // Obter dados do localStorage
      const storedData = getStoredData()
      
      console.log('Parâmetros da URL:', urlParams)
      console.log('Dados armazenados:', storedData)
      
      // Capturar parâmetros UTM da URL atual
      const utmParams: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search)
        ;['utm_source', 'utm_medium', 'utm_content', 'utm_term', 'utm_campaign'].forEach((param: string) => {
          const value = searchParams.get(param)
          if (value) utmParams[param] = value
        })
      }
      console.log('Parâmetros UTM detectados na URL atual:', utmParams)
      
      // Usar os dados do usuário autenticado ou dos parâmetros
      const userId = user?.uid || urlParams.userId || storedData?.userId
      const partnerId = urlParams.partnerId || storedData?.partnerId
      const partnerLinkId = urlParams.partnerLinkId || storedData?.partnerLinkId
      const token = urlParams.token || undefined
      const transactionId = urlParams.transactionId || undefined
      const paymentId = urlParams.paymentId || undefined
      const orderId = urlParams.orderId || undefined
      const paymentMethod = urlParams.paymentMethod || undefined
      
      // Validar dados mínimos - usar qualquer identificador disponível
      const paymentIdentifier = token || transactionId || paymentId || orderId
      if (!paymentIdentifier) {
        console.warn('Nenhum identificador de pagamento encontrado nos parâmetros:', urlParams)
        
        // Se não temos identificador mas temos informações de parceiro, vamos tentar continuar
        if (partnerId) {
          console.log('Continuando com informações de parceiro disponíveis')
        } else {
          throw new Error('Identificador de pagamento não encontrado')
        }
      }
      
      // Verificar se temos um usuário identificado
      if (!userId) {
        // Se não temos userId mas o usuário não está autenticado, redirecionar para login
        if (!authLoading && !user) {
          console.log('Usuário não autenticado, redirecionando para login')
          localStorage.setItem('payment_pending', JSON.stringify({
            token,
            transactionId,
            paymentId,
            orderId,
            paymentMethod,
            partnerId,
            partnerLinkId,
            utmParams,
            redirectedAt: new Date().toISOString()
          }))
          router.push('/login')
          return
        }
        
        // Se não temos userId nem mesmo no Auth, seguir com o fluxo anônimo
        // isso permitirá enviar o email de ativação
        console.log('Processando pagamento sem ID de usuário')
      }
      
      // Salvar informações de parceiro para o webhook recuperar posteriormente
      if (partnerId) {
        const pendingId = await savePendingSubscription({
          userId,
          userEmail: user?.email || storedData?.userEmail,
          partnerId,
          partnerLinkId,
          token
        })
        
        console.log('ID da assinatura pendente:', pendingId)
      }
      
      // Buscar qualquer outra informação útil dos dados armazenados
      const planName = storedData?.planName
      const price = storedData?.price
      const interval = storedData?.interval
      
      // Chamar API para associar o pagamento ao usuário
      const callbackUrl = new URL('/api/lastlink/callback', window.location.origin)
      
      // Adicionar parâmetros relevantes na URL
      if (token) callbackUrl.searchParams.append('token', token)
      if (transactionId) callbackUrl.searchParams.append('transactionId', transactionId)
      if (paymentId) callbackUrl.searchParams.append('paymentId', paymentId)
      if (orderId) callbackUrl.searchParams.append('orderId', orderId)
      if (userId) callbackUrl.searchParams.append('userId', userId)
      if (partnerId) callbackUrl.searchParams.append('partnerId', partnerId)
      if (partnerLinkId) callbackUrl.searchParams.append('partnerLinkId', partnerLinkId)
      if (paymentMethod) callbackUrl.searchParams.append('paymentMethod', paymentMethod)
      
      // Adicionar informações de plano se disponíveis
      if (planName) callbackUrl.searchParams.append('planName', planName)
      if (price) callbackUrl.searchParams.append('price', price.toString())
      if (interval) callbackUrl.searchParams.append('interval', interval)
      
      // Adicionar parâmetros UTM
      Object.entries(utmParams).forEach(([key, value]) => {
        callbackUrl.searchParams.append(key, value)
      })
      
      // Adicionar UTMs dos dados armazenados se não estiverem na URL
      if (storedData) {
        ['utm_source', 'utm_medium', 'utm_content', 'utm_term', 'utm_campaign'].forEach((param: string) => {
          if (storedData[param] && !utmParams[param]) {
            callbackUrl.searchParams.append(param, storedData[param] as string)
          }
        })
      }
      
      console.log('Chamando callback com URL:', callbackUrl.toString())
      
      const response = await fetch(callbackUrl.toString())
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao processar pagamento')
      }
      
      const data = await response.json()
      console.log('Resposta do callback:', data)
      
      // Atualizar estado com detalhes do pagamento
      setPaymentDetails(data)
      setProcessingPayment(false)
      
      // Enviar email de ativação se for um novo usuário
      if (!user) {
        // Obter os dados necessários de fontes seguras
        const customerEmail = data?.customerEmail || storedData?.userEmail
        const customerName = data?.customerName || storedData?.userName
        
        if (customerEmail) {
          console.log('Enviando email de ativação para:', customerEmail)
          try {
            await sendActivationEmail(
              customerEmail,
              customerName || ''
            )
            console.log('Email de ativação enviado com sucesso')
          } catch (activationError) {
            console.error('Erro ao enviar email de ativação:', activationError)
            // Continuar mesmo se o envio falhar, para não bloquear o fluxo
            setPaymentDetails({
              ...data,
              customerEmail,
              requiresActivation: true,
              activationError: true
            })
            return
          }
        }
        
        // Definir detalhes do pagamento
        setPaymentDetails({
          ...data,
          customerEmail,
          requiresActivation: true
        })
      } else {
        setPaymentDetails({
          ...data,
          requiresActivation: false
        })
      }
      
      // Limpar dados armazenados após processamento bem-sucedido
      localStorage.removeItem('lastlink_checkout_data')
      localStorage.removeItem('checkoutData')
      localStorage.removeItem('payment_pending')
      
      // Mostrar mensagem de sucesso ao usuário
      toast.success('Pagamento processado com sucesso! Sua assinatura está ativa.')
      
      // Aguardar 3 segundos e redirecionar para o perfil
      setTimeout(() => {
        if (user?.userType === 'member') {
          router.push('/member/feed')
        } else if (user) {
          router.push('/')
        }
      }, 3000)
      
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      setError(error.message || 'Erro ao processar pagamento')
      setProcessingPayment(false)
      
      // Exibir mensagem de erro
      toast.error(error.message || 'Erro ao processar pagamento. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }
  
  // Processar pagamento quando componente for montado
  useEffect(() => {
    // Aguardar carregamento da autenticação
    if (authLoading) return
    
    processPayment()
  }, [authLoading])
  
  // Mostrar estados de carregamento e erro
  if (loading || processingPayment) {
  return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-lg text-zinc-600">
          {loading ? 'Aguarde um momento...' : 'Processando seu pagamento...'}
          </p>
        </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-red-600 text-xl">✖</span>
        </div>
        <h2 className="text-xl font-bold text-red-600">Ops! Algo deu errado</h2>
        <p className="text-center text-zinc-600 max-w-md">{error}</p>

        <div className="flex space-x-4 mt-6">
          <Button
            onClick={() => router.push('/')} 
            variant="outline"
          >
            Voltar para o início
          </Button>
          <Button
            onClick={() => processPayment()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }
  
  // Tela de sucesso
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-emerald-600">Pagamento confirmado!</h2>
      
      {paymentDetails?.requiresActivation ? (
        <>
          <p className="text-center text-zinc-600 max-w-md">
            Seu pagamento foi processado com sucesso! Enviamos um email para 
            <strong> {paymentDetails.customerEmail}</strong> com instruções para ativar sua conta.
          </p>
          <p className="text-center text-zinc-500 max-w-md">
            Por favor, verifique sua caixa de entrada e siga as instruções para definir sua senha e 
            começar a usar a plataforma.
          </p>
          {paymentDetails.activationError && (
            <p className="text-center text-amber-600 max-w-md mt-2">
              Houve um problema ao enviar o email de ativação. Por favor, entre em contato com 
              o suporte se não receber o email em alguns minutos.
            </p>
          )}
        </>
      ) : (
        <p className="text-center text-zinc-600 max-w-md">
          Seu pagamento foi processado com sucesso. Você já tem acesso a todos os benefícios da plataforma.
        </p>
      )}
      
      <Button 
        onClick={() => router.push(user?.userType === 'member' ? '/member/feed' : '/')} 
        className="mt-8 bg-emerald-600 hover:bg-emerald-700 flex items-center space-x-2"
      >
        <span>{paymentDetails?.requiresActivation ? 'Voltar ao início' : 'Ir para o feed'}</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

// Componente principal com Suspense para evitar erro de hidratação
export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24">
            <Image 
              src="/logo.svg" 
              alt="Logo" 
              fill 
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Conteúdo principal */}
    <Suspense fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="text-lg text-zinc-600">Carregando...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
      </div>
    </div>
  )
} 