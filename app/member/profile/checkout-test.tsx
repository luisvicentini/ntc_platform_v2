"use client"

import { Button } from "@/components/ui/button"
import { loadStripe } from "@stripe/stripe-js"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { useState, useEffect } from "react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function CheckoutTest() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [prices, setPrices] = useState<any[]>([])

  // Buscar preços disponíveis
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/stripe/prices')
        const data = await response.json()
        setPrices(data.prices)
      } catch (error) {
        console.error('Erro ao buscar preços:', error)
      }
    }

    fetchPrices()
  }, [])

  const handleCheckout = async () => {
    if (!user?.email || !user?.uid) {
      toast.error("Usuário não está logado")
      return
    }

    if (prices.length === 0) {
      toast.error("Nenhum plano disponível")
      return
    }

    setLoading(true)

    try {
      // Criar ou obter o customer
      const customerResponse = await fetch('/api/stripe/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.uid,
        }),
      })

      if (!customerResponse.ok) {
        const error = await customerResponse.json()
        throw new Error(error.error || 'Erro ao criar cliente')
      }

      const { customerId } = await customerResponse.json()

      // Criar a sessão de checkout com o primeiro preço disponível
      const checkoutResponse = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: prices[0].id, // Usar o primeiro preço disponível
          customerId: customerId,
          partnerId: 'MChsM1JopUMB2ye2Tdvp',
        }),
      })

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json()
        throw new Error(error.error || 'Erro ao criar sessão de checkout')
      }

      const { sessionId } = await checkoutResponse.json()
      
      const stripe = await stripePromise
      const { error } = await stripe!.redirectToCheckout({ sessionId })
      
      if (error) {
        throw new Error(error.message)
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error)
      toast.error(error.message || 'Erro ao processar checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <Button 
        onClick={handleCheckout}
        className="bg-[#7435db] hover:bg-[#a85fdd] text-white"
        disabled={!user || loading || prices.length === 0}
      >
        {loading ? "Processando..." : "Testar Checkout"}
      </Button>
    </div>
  )
} 