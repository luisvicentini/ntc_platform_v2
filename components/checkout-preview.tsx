"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { CheckCircle2, CreditCard } from "lucide-react"
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
}

export function CheckoutPreview({ partnerLink }: { partnerLink: PartnerLink }) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleStartOnboarding = () => {
    // Salvar os dados do plano no localStorage para usar depois do registro
    const checkoutData = {
      priceId: partnerLink.priceId,
      partnerId: partnerLink.partnerId,
      partnerLinkId: partnerLink.id,
      planName: partnerLink.planName,
      price: partnerLink.price,
      interval: partnerLink.interval
    }
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData))
    
    // Redirecionar para a página de registro correta
    router.push('/auth/register?redirect=onboarding')
  }

  return (
    <div className="p-8">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-white shadow-lg border-4 border-purple-100">
          <Image
            src="/ntc_logo.svg"
            alt="Logo NTC"
            fill
            className="object-contain p-4"
            priority
          />
        </div>
      </div>

      {/* Detalhes do Plano */}
      <div className="text-center space-y-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {partnerLink.planName}
          </h2>
          <p className="text-gray-600">
            {partnerLink.description}
          </p>
        </div>

        {/* Preços */}
        <div className="bg-purple-50 rounded-xl p-6">
          <div className="space-y-2">
            {/* Valor mensal */}
            <p className="text-4xl font-bold text-purple-600">
              R$ {partnerLink.price.toFixed(2)}
              <span className="text-base font-normal text-gray-600">/mês</span>
            </p>
            
            {/* Valor total e período */}
            <div className="text-sm text-gray-500">
              <p>Valor total: R$ {partnerLink.price.toFixed(2)}</p>
              <p>Cobrança {partnerLink.interval === 'month' ? 'mensal' : 'semestral'}</p>
            </div>
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
            <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-gray-700">{benefit}</span>
          </div>
        ))}
      </div>

      {/* Informação do Stripe */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <CreditCard className="w-4 h-4" />
          <span>Pagamento processado por</span>
          <svg 
            viewBox="0 0 60 25" 
            xmlns="http://www.w3.org/2000/svg" 
            width="60" 
            height="25" 
            className="inline-block"
          >
            <title>Stripe logo</title>
            <path 
              fill="currentColor" 
              d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z" 
              fillRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Botão de Ação */}
      <Button
        onClick={handleStartOnboarding}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
      >
        {loading ? 'Processando...' : 'Começar a usar os cupons'}
      </Button>
    </div>
  )
} 