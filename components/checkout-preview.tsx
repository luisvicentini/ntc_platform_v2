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
            className="object-contain p-6"
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

            {/* Valor da parcela */}
            {/* Só exibe se for plano mensal */}
            {partnerLink.interval == 'month' && (
            <p className="text-4xl font-bold text-purple-600">
              R$ {calculateInstallment().toFixed(2)}
              <span className="text-base font-normal text-gray-600">/mês</span>
            </p>
             )}
             
            {/* Valor total e período - só exibe se não for plano mensal */}
            {partnerLink.interval !== 'month' && (
              <div className="text-sm text-gray-500">
                <p className="text-4xl font-bold text-purple-600">
                  <span className="text-base font-normal text-gray-600">{getInstallments()}x de </span>R$ {calculateInstallment().toFixed(2)} <span className="text-base font-normal text-gray-600">/mês</span>
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
            <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-gray-700">{benefit}</span>
          </div>
        ))}
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