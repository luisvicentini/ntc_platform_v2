'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkoutData, setCheckoutData] = useState<any>(null)

  useEffect(() => {
    // Se não estiver logado, redireciona para o registro
    if (!user) {
      router.push('/register')
      return
    }

    // Recuperar dados do plano do localStorage
    const savedData = localStorage.getItem('checkoutData')
    if (savedData) {
      setCheckoutData(JSON.parse(savedData))
    } else {
      router.push('/')
    }
  }, [user, router])

  const handleCheckout = async () => {
    if (!checkoutData) return

    setLoading(true)
    try {
      // Criar a sessão de checkout
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: checkoutData.priceId,
          partnerId: checkoutData.partnerId,
          partnerLinkId: checkoutData.partnerLinkId,
          customerId: user?.uid // Agora temos o ID do usuário
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Limpar dados do localStorage
      localStorage.removeItem('checkoutData')

      // Redirecionar para o Stripe
      window.location.href = data.url
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      toast.error('Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  if (!checkoutData) return null

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl text-ntc-zinc font-bold mb-6">Confirme sua assinatura</h1>
          
          <div className="mb-8">
            <h2 className="text-xl text-ntc-zinc font-semibold mb-4">{checkoutData.planName}</h2>
            <p className="text-zinc-600 mb-4">
              Valor: R$ {checkoutData.price.toFixed(2)}/{checkoutData.interval}
            </p>
            <div className="bg-zinc-50 p-4 rounded">
              <p className="text-sm text-zinc-600">
                Você está logado como: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
          >
            {loading ? 'Processando...' : 'Finalizar assinatura'}
          </Button>
        </div>
      </div>
    </div>
  )
} 