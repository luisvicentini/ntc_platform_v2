"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { loadStripe } from "@stripe/stripe-js"
import { toast } from "sonner"
import type { PartnerSalesLink } from "@/types/partner"
import { useAuth } from "@/contexts/auth-context"
import { Check as CheckIcon } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutPreviewProps {
  partnerLink: PartnerSalesLink
}

export function CheckoutPreview({ partnerLink }: CheckoutPreviewProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('PartnerLink recebido:', partnerLink)
    if (!partnerLink?.priceId) {
      console.error('PriceId não encontrado no partnerLink:', partnerLink)
    }
  }, [partnerLink])

  const handleCheckout = async () => {
    if (!user?.email || !user?.uid) {
      toast.error("Usuário não está logado")
      return
    }

    if (!partnerLink?.priceId) {
      toast.error("Preço não configurado para este link")
      return
    }

    try {
      setLoading(true)
      console.log('Iniciando checkout com:', { 
        priceId: partnerLink.priceId,
        partnerId: partnerLink.partnerId,
        partnerLinkId: partnerLink.id 
      })

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
        const errorData = await customerResponse.json()
        throw new Error(errorData.error || 'Erro ao criar cliente')
      }

      const { customerId } = await customerResponse.json()

      const checkoutResponse = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: partnerLink.priceId,
          customerId,
          partnerId: partnerLink.partnerId,
          partnerLinkId: partnerLink.id
        }),
      })

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        throw new Error(errorData.error || 'Erro ao criar sessão de checkout')
      }

      const { sessionId } = await checkoutResponse.json()
      
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe não inicializado')
      }

      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error)
      toast.error(error.message || 'Erro ao processar checkout')
    } finally {
      setLoading(false)
    }
  }

  if (!partnerLink?.priceId) {
    return (
      <div className="container max-w-md py-10">
        <Card>
          <CardContent className="space-y-6">
            <p className="text-center text-red-500">
              Este link não possui um preço configurado.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <Card className="bg-[#131320] border-[#1a1b2d] max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-[#e5e2e9] text-center">
            Assine Agora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Aqui você pode adicionar mais detalhes do plano */}
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold text-[#e5e2e9]">
              R$ 49,90/mês
            </h2>
            <p className="text-[#7a7b9f]">
              Acesso completo a todos os recursos
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[#e5e2e9] font-medium">O que está incluído:</h3>
            <ul className="space-y-2 text-[#7a7b9f]">
              <li className="flex items-center">
                <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                Acesso a todos os estabelecimentos parceiros
              </li>
              <li className="flex items-center">
                <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                Descontos exclusivos
              </li>
              <li className="flex items-center">
                <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                Suporte prioritário
              </li>
            </ul>
          </div>

          <Button
            onClick={handleCheckout}
            className="w-full bg-[#7435db] hover:bg-[#a85fdd] text-white"
            disabled={loading}
          >
            {loading ? "Processando..." : "Assinar Agora"}
          </Button>

          <p className="text-sm text-[#7a7b9f] text-center">
            Pagamento seguro via Stripe
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 