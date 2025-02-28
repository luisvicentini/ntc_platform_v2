"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (sessionId) {
      fetchSubscriptionDetails(sessionId)
    }
  }, [searchParams])

  const fetchSubscriptionDetails = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/session-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      })
      const data = await response.json()
      setSubscriptionDetails(data)
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error)
      toast.error('Erro ao carregar detalhes da assinatura')
    }
  }

  const handleSyncSubscription = async () => {
    try {
      setLoading(true)
      
      // Simular o evento webhook
      const response = await fetch('/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'manual-sync'
        },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: subscriptionDetails
          }
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao sincronizar assinatura')
      }

      toast.success('Assinatura sincronizada com sucesso!')
      router.push('/feed') // Redirecionar para o feed
    } catch (error) {
      console.error('Erro na sincronização:', error)
      toast.error('Erro ao sincronizar assinatura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">
          Parabéns! Sua assinatura foi confirmada
        </h1>
        
        <p className="text-lg text-muted-foreground">
          Estamos quase lá! Para começar a usar os cupons, 
          precisamos sincronizar sua assinatura.
        </p>

        {subscriptionDetails && (
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Detalhes da sua assinatura
            </h2>
            {/* Adicione mais detalhes aqui */}
          </div>
        )}

        <Button
          onClick={handleSyncSubscription}
          disabled={loading}
          size="lg"
          className="w-full max-w-md"
        >
          {loading && <Loader className="mr-2" />}
          Começar a usar os cupons
        </Button>
      </div>
    </div>
  )
} 