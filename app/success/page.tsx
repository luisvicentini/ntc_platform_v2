"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

// Componente interno que usa useSearchParams
function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const token = searchParams.get('token')
  const paymentMethod = searchParams.get('paymentMethod')
  
  useEffect(() => {
    const processLastlinkPayment = async () => {
      try {
        // Verificar se temos token na URL (redirecionamento da Lastlink)
        if (!token) {
          console.log('Nenhum token encontrado na URL')
          setProcessingPayment(false)
          setLoading(false)
          return
        }
        
        console.log('Token encontrado na URL:', token)
        console.log('Método de pagamento:', paymentMethod)
        
        // Recuperar dados salvos na localStorage
        const lastlinkData = localStorage.getItem('lastlink_checkout_data')
        const checkoutData = localStorage.getItem('checkoutData')
        
        let userId = user?.uid
        let partnerId = null
        let partnerLinkId = null
        
        if (lastlinkData) {
          try {
            const parsedData = JSON.parse(lastlinkData)
            userId = userId || parsedData.userId
            partnerId = parsedData.partnerId
            partnerLinkId = parsedData.partnerLinkId
            
            console.log('Dados recuperados do localStorage:', parsedData)
          } catch (e) {
            console.error('Erro ao parsear dados do localStorage:', e)
          }
        } else if (checkoutData) {
          try {
            const parsedData = JSON.parse(checkoutData)
            partnerId = parsedData.partnerId
            partnerLinkId = parsedData.partnerLinkId
            
            console.log('Dados de checkout recuperados:', parsedData)
          } catch (e) {
            console.error('Erro ao parsear dados de checkout:', e)
          }
        }
        
        // Se o usuário não estiver logado, não podemos processar
        if (!userId) {
          console.log('Usuário não está logado, redirecionando para login')
          // Manter os dados para processamento após login
          router.push('/auth/login?redirect=success')
          return
        }
        
        // Chamar API para associar o pagamento ao usuário
        const callbackUrl = new URL('/api/lastlink/callback', window.location.origin)
        
        // Adicionar parâmetros relevantes na URL
        if (userId) callbackUrl.searchParams.append('userId', userId)
        if (partnerId) callbackUrl.searchParams.append('partnerId', partnerId)
        if (partnerLinkId) callbackUrl.searchParams.append('partnerLinkId', partnerLinkId)
        if (token) callbackUrl.searchParams.append('token', token)
        if (paymentMethod) callbackUrl.searchParams.append('paymentMethod', paymentMethod)
        
        console.log('Chamando callback com parâmetros:', callbackUrl.toString())
        
        const response = await fetch(callbackUrl.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Falha ao processar pagamento')
        }
        
        console.log('Pagamento processado com sucesso')
        
        // Limpar dados do localStorage
        localStorage.removeItem('lastlink_checkout_data')
        localStorage.removeItem('checkoutData')
        
        setProcessingPayment(false)
      } catch (err) {
        console.error('Erro ao processar pagamento:', err)
        setError('Ocorreu um erro ao processar seu pagamento. Por favor, entre em contato com o suporte.')
        setProcessingPayment(false)
      } finally {
        setLoading(false)
      }
    }
    
    // Processar o pagamento quando o componente montar
    processLastlinkPayment()
  }, [token, paymentMethod, router, user])
  
  const goToProfile = () => {
    router.push('/member/profile')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-zinc-100">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-t-4 border-orange-500 border-solid rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-zinc-800">Processando seu pagamento...</h2>
          <p className="text-zinc-500 mt-2">Por favor, aguarde enquanto finalizamos seu pedido.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-zinc-100 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          {/* Logo */}
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <Image
              src="/logo.svg"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          
          {error ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">!</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-800 mb-4">Algo deu errado</h1>
              <p className="text-zinc-600 mb-6">{error}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-800 mb-4">Pagamento Confirmado!</h1>
              <p className="text-zinc-600 mb-6">
                {processingPayment 
                  ? "Estamos processando seu pagamento..." 
                  : "Seu pagamento foi processado com sucesso e sua assinatura está ativa."}
              </p>
              
              {/* Detalhes do pagamento */}
              <div className="bg-zinc-50 p-4 rounded-lg mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-500">Método de pagamento:</span>
                  <span className="font-medium text-zinc-700">{paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-500">Status:</span>
                  <span className="text-emerald-600 font-medium">Confirmado</span>
                </div>
              </div>
            </>
          )}
          
          <Button 
            onClick={goToProfile} 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Ir para minha conta <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Componente principal que envolve o conteúdo em Suspense
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-zinc-100">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-t-4 border-orange-500 border-solid rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-zinc-800">Carregando...</h2>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
} 