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
      
      // Usar os dados do usuário autenticado ou dos parâmetros
      const userId = user?.uid || urlParams.userId || storedData?.userId
      const partnerId = urlParams.partnerId || storedData?.partnerId
      const partnerLinkId = urlParams.partnerLinkId || storedData?.partnerLinkId
      const token = urlParams.token
      const paymentMethod = urlParams.paymentMethod
      
      // Validar dados mínimos
      if (!token) {
        throw new Error('Token de pagamento não encontrado')
      }
      
      if (!userId) {
        // Se não temos userId mas o usuário não está autenticado, redirecionar para login
        if (!authLoading && !user) {
          console.log('Usuário não autenticado, redirecionando para login')
          localStorage.setItem('payment_pending', JSON.stringify({
            token,
            paymentMethod,
            partnerId,
            partnerLinkId,
            redirectedAt: new Date().toISOString()
          }))
          router.push('/auth/login?redirect=success')
          return
        }
        throw new Error('ID do usuário não encontrado')
      }
      
      // Chamar API para associar o pagamento ao usuário
      const callbackUrl = new URL('/api/lastlink/callback', window.location.origin)
      
      // Adicionar parâmetros relevantes na URL
      callbackUrl.searchParams.append('token', token)
      if (userId) callbackUrl.searchParams.append('userId', userId)
      if (partnerId) callbackUrl.searchParams.append('partnerId', partnerId)
      if (partnerLinkId) callbackUrl.searchParams.append('partnerLinkId', partnerLinkId)
      if (paymentMethod) callbackUrl.searchParams.append('paymentMethod', paymentMethod)
      
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
      
      // Limpar dados armazenados após processamento bem-sucedido
      localStorage.removeItem('lastlink_checkout_data')
      
      // Aguardar 3 segundos e redirecionar para o perfil
      setTimeout(() => {
        if (user?.userType === 'member') {
          router.push('/member/profile')
        } else if (user) {
          router.push('/')
        }
      }, 3000)
      
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      setError(error.message || 'Erro ao processar pagamento')
      setProcessingPayment(false)
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
      
      <p className="text-center text-zinc-600 max-w-md">
        Seu pagamento foi processado com sucesso. Você já tem acesso a todos os benefícios da plataforma.
      </p>
      
      <Button 
        onClick={() => router.push('/member/feed')} 
        className="mt-8 bg-emerald-600 hover:bg-emerald-700 flex items-center space-x-2"
      >
        <span>Ir para meu perfil</span>
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