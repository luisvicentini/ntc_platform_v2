"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { loadStripe } from '@stripe/stripe-js'
import { StripeSubscription, StripeTransaction } from '@/types/stripe'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader } from "@/components/ui/loader"
import { Loader2Icon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'diners' | 'unionpay'

const cardBrandMap: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  jcb: 'JCB',
  diners: 'Diners Club',
  unionpay: 'UnionPay'
}

// Interface base para método de pagamento
interface BasePaymentMethod {
  type: 'stripe' | 'lastlink';
}

// Interface para método de pagamento do Stripe
interface StripePaymentMethod extends BasePaymentMethod {
  type: 'stripe';
  brand: CardBrand;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}

// Interface para método de pagamento da Lastlink
interface LastlinkPaymentMethod extends BasePaymentMethod {
  type: 'lastlink';
  method: string;
  details?: string;
}

// Interface base para transação
interface Transaction {
  id: string;
  amount: number;
  created?: number;
  status?: string;
  currency: string;
  description?: string;
  provider: 'stripe' | 'lastlink';
}

// Interface base para assinatura
interface Subscription {
  id: string;
  provider: 'stripe' | 'lastlink';
  status: string;
  planName: string;
  amount?: number;
  price?: number;
  currency: string;
  interval?: string;
  intervalCount?: number;
  created?: number;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  canceledAt?: number;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: StripePaymentMethod | LastlinkPaymentMethod;
  orderId?: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type StatusInfo = {
  color: string
  label: string
}

// Ajustar o tipo StatusKey para incluir todos os status possíveis
type StatusKey = 
  | 'active' 
  | 'ativa' 
  | 'iniciada' 
  | 'canceled' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'past_due' 
  | 'trialing' 
  | 'unpaid' 
  | 'unknown'
  | 'succeeded'
  | 'failed'
  | 'pending';

type IntervalKey = 'month' | 'year' | 'week' | 'day';

const statusMap: Record<StatusKey, StatusInfo> = {
  'active': { color: 'bg-green-500', label: 'Ativa' },
  'ativa': { color: 'bg-green-500', label: 'Ativa' },
  'iniciada': { color: 'bg-green-500', label: 'Ativa' },
  'canceled': { color: 'bg-red-500', label: 'Cancelada' },
  'incomplete': { color: 'bg-yellow-500', label: 'Incompleta' },
  'incomplete_expired': { color: 'bg-red-500', label: 'Expirada' },
  'past_due': { color: 'bg-yellow-500', label: 'Atrasada' },
  'trialing': { color: 'bg-blue-500', label: 'Teste' },
  'unpaid': { color: 'bg-red-500', label: 'Não paga' },
  'unknown': { color: 'bg-zinc-500', label: 'Desconhecido' },
  'succeeded': { color: 'bg-green-500', label: 'Concluído' },
  'failed': { color: 'bg-red-500', label: 'Falhou' },
  'pending': { color: 'bg-yellow-500', label: 'Pendente' }
}

const intervalMap: Record<IntervalKey, string> = {
  'month': 'mês',
  'year': 'ano',
  'week': 'semana',
  'day': 'dia'
}

export function SubscriptionManagement({ userId }: { userId: string }) {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState<any[]>([])
  const [showPricesDialog, setShowPricesDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelationType, setCancelationType] = useState<'immediate' | 'end_of_period'>('end_of_period')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      const email = user?.email || ''
      
      // Array para armazenar todas as assinaturas (Stripe + Lastlink)
      let allSubscriptions: Subscription[] = []
      let allTransactions: Transaction[] = []

      // 1. Buscar assinaturas do Stripe
      const stripeResponse = await fetch(`/api/user/subscription?userId=${userId}&email=${encodeURIComponent(email)}`)
      
      if (stripeResponse.ok) {
        const stripeData = await stripeResponse.json()
        console.log('Dados de assinatura Stripe recebidos:', stripeData)
        
        // Adicionar assinaturas do Stripe ao array
        if (stripeData.subscriptions && stripeData.subscriptions.length > 0) {
          const stripeSubscriptions = stripeData.subscriptions.map((sub: any) => ({
            id: sub.id,
            provider: 'stripe' as const,
            status: sub.status || 'unknown',
            planName: sub.planName || 'Plano Premium',
            amount: sub.amount,
            currency: sub.currency || 'BRL',
            interval: sub.interval || 'month',
            intervalCount: sub.intervalCount || 1,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            created: sub.created,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
            canceledAt: sub.canceledAt,
            paymentMethod: sub.paymentMethod ? {
              type: 'stripe' as const,
              brand: sub.paymentMethod.brand,
              last4: sub.paymentMethod.last4,
              expiryMonth: sub.paymentMethod.expiryMonth,
              expiryYear: sub.paymentMethod.expiryYear
            } : undefined
          }))
          allSubscriptions = [...stripeSubscriptions]
        }
        
        // Adicionar transações do Stripe ao array
        if (stripeData.transactions && stripeData.transactions.length > 0) {
          const stripeTransactions = stripeData.transactions.map((trans: any) => ({
            id: trans.id,
            amount: trans.amount,
            currency: trans.currency || 'BRL',
            status: trans.status || 'succeeded',
            created: trans.created,
            description: trans.description || 'Pagamento Stripe',
            provider: 'stripe' as const
          }))
          allTransactions = [...stripeTransactions]
        }
      }
      
      // 2. Buscar assinaturas do Lastlink
      const lastlinkResponse = await fetch(`/api/user/subscription/lastlink?userId=${userId}&email=${encodeURIComponent(email)}`)
      
      if (lastlinkResponse.ok) {
        const lastlinkData = await lastlinkResponse.json()
        console.log('Dados de assinatura Lastlink recebidos:', lastlinkData)
        
        // Converter assinaturas do Lastlink para o formato compatível
        if (lastlinkData.subscriptions && lastlinkData.subscriptions.length > 0) {
          const lastlinkSubscriptions = lastlinkData.subscriptions.map((sub: any) => {
            const paymentDetails = sub.paymentDetails || {}
            const now = new Date()
            const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            const createdAtDate = new Date(sub.createdAt || now)
            
            return {
              id: sub.id,
              provider: 'lastlink' as const,
              status: sub.status || 'active',
              planName: paymentDetails.planName || 'Plano Premium',
              amount: paymentDetails.amount || 9900,
              currency: 'BRL',
              interval: paymentDetails.planInterval || 'month',
              intervalCount: paymentDetails.planIntervalCount || 1,
              currentPeriodStart: Math.floor(createdAtDate.getTime() / 1000),
              currentPeriodEnd: Math.floor(expiresAt.getTime() / 1000),
              created: Math.floor(createdAtDate.getTime() / 1000),
              cancelAtPeriodEnd: false,
              orderId: sub.orderId,
              paymentMethod: {
                type: 'lastlink' as const,
                method: sub.paymentMethod || 'Cartão de Crédito',
                details: sub.paymentDetails?.description
              }
            }
          })
          
          allSubscriptions = [...allSubscriptions, ...lastlinkSubscriptions]
        }
        
        // Converter pagamentos do Lastlink
        if (lastlinkData.payments && lastlinkData.payments.length > 0) {
          const lastlinkTransactions = lastlinkData.payments.map((payment: any) => {
            const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date()
            
            return {
              id: payment.id,
              amount: payment.amount || 0,
              currency: 'BRL',
              status: payment.status || 'succeeded',
              created: Math.floor(paidAt.getTime() / 1000),
              description: `Pagamento ${payment.planName || 'Premium'} - Lastlink`,
              provider: 'lastlink' as const
            }
          })
          
          allTransactions = [...allTransactions, ...lastlinkTransactions]
        }
      }
      
      // Ordenar assinaturas: ativas primeiro, depois por data
      allSubscriptions.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1
        if (a.status !== 'active' && b.status === 'active') return 1
        return (b.created || 0) - (a.created || 0)
      })
      
      // Ordenar transações por data
      allTransactions.sort((a, b) => (b.created || 0) - (a.created || 0))
      
      console.log('Assinaturas consolidadas:', allSubscriptions)
      console.log('Transações consolidadas:', allTransactions)
      
      setSubscriptions(allSubscriptions)
      setTransactions(allTransactions)
    } catch (error) {
      console.error('Erro ao buscar dados da assinatura:', error)
      setError('Erro ao carregar dados da assinatura')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchSubscriptionData()
      fetchPrices()
    }
  }, [userId])

  // Funções auxiliares com verificação de nulidade e tipos mais específicos
  const formatStatus = (status: string | undefined): string => {
    if (!status) return 'Desconhecido'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Função para formatar o provedor
  const formatProvider = (provider: 'stripe' | 'lastlink'): string => {
    return provider === 'lastlink' ? 'Lastlink' : 'Stripe'
  }

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/stripe/prices')
      const data = await response.json()
      setPrices(data.prices)
    } catch (error) {
      console.error('Erro ao buscar preços:', error)
    }
  }

  const handleSubscribe = async (priceId: string) => {
    if (!user?.email || !user?.uid) {
      toast.error("Usuário não está logado")
      return
    }

    if (!priceId) {
      toast.error("Preço não selecionado")
      return
    }

    try {
      setLoading(true)
      console.log('Iniciando checkout com:', { priceId }) // Debug
      
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
        throw new Error('Erro ao criar cliente')
      }

      const { customerId } = await customerResponse.json()

      // Verificar se temos o partnerId do link
      const partnerLinkId = new URLSearchParams(window.location.search).get('ref')
      const partnerId = partnerLinkId ? '42797K2f9lBo3tbnzrpT' : 'MChsM1JopUMB2ye2Tdvp'

      const checkoutResponse = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId, // Garantir que o priceId está sendo passado
          customerId,
          partnerId,
          partnerLinkId,
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
      setShowPricesDialog(false)
    } finally {
      setLoading(false)
    }
  }

  // Pegar a assinatura ativa (se houver)
  const activeSubscription = subscriptions.find(sub => sub.status === 'active') as Subscription | undefined
  const hasOnlyCanceledSubscriptions = subscriptions.length > 0 && !activeSubscription

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return

    try {
      setCancelLoading(true)
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: activeSubscription.id,
          cancelationType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao cancelar assinatura')
      }

      await fetchSubscriptionData() // Recarrega os dados
      toast.success(
        cancelationType === 'immediate' 
          ? 'Assinatura cancelada com sucesso' 
          : 'Assinatura será cancelada ao final do período'
      )
      setShowCancelDialog(false)
    } catch (error: any) {
      console.error('Erro ao cancelar:', error)
      toast.error(error.message || 'Erro ao cancelar assinatura')
    } finally {
      setCancelLoading(false)
    }
  }

  // Função para formatar datas com verificação de nulidade
  const formatDate = (timestamp: number | undefined, isLastlink: boolean = false): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Função para formatar valores monetários
  const formatCurrency = (amount: number | undefined, currency: string, isLastlink: boolean = false): string => {
    if (typeof amount === 'undefined') return '-'
    const value = isLastlink ? amount : amount / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value)
  }

  // Função para obter o status formatado com verificação de tipo
  const getFormattedStatus = (status: string): StatusInfo => {
    const normalizedStatus = status.toLowerCase();
    const defaultStatus: StatusInfo = { color: 'bg-zinc-500', label: 'Desconhecido' };
    
    return statusMap[normalizedStatus as StatusKey] || defaultStatus;
  };

  // Função para obter o intervalo
  const getInterval = (subscription: Subscription | null): string => {
    if (!subscription?.interval) return 'mês';
    const interval = subscription.interval.toLowerCase();
    return intervalMap[interval as IntervalKey] || 'mês';
  };

  // Função para formatar o cartão
  const formatCardBrand = (brand: CardBrand | undefined): string => {
    if (!brand) return 'Cartão'
    return cardBrandMap[brand] || brand
  }

  // Função para formatar transação
  const formatTransaction = (transaction: Transaction): string => {
    const amount = transaction.amount // amount é obrigatório agora
    const currency = transaction.currency || 'BRL'
    const isLastlink = transaction.provider === 'lastlink'
    
    return formatCurrency(amount, currency, isLastlink)
  }

  // Função para renderizar o método de pagamento
  const renderPaymentMethod = (subscription: Subscription) => {
    if (!subscription.paymentMethod) return null;

    if (subscription.provider === 'stripe' && subscription.paymentMethod.type === 'stripe') {
      return (
        <div>
          <h4 className="text-sm font-sm text-zinc-400 mb-1">Forma de Pagamento</h4>
          <div className="flex flex-col items-left gap-2 bg-zinc-100 p-3 rounded-xl justify-between md:w-[55%] sm:max-w-[100%]">
            <p className="text-zinc-600">
              <span className="bg-white px-2 rounded-md font-medium text-indigo-400">
                {formatCardBrand(subscription.paymentMethod.brand)}
              </span>
              <span className="font-medium"> **** **** **** {subscription.paymentMethod.last4}</span>
            </p>
            <p className="text-sm text-zinc-400">
              Exp date: {String(subscription.paymentMethod.expiryMonth).padStart(2, '0')}/{subscription.paymentMethod.expiryYear}
            </p>
          </div>
        </div>
      );
    }

    if (subscription.provider === 'lastlink' && subscription.paymentMethod.type === 'lastlink') {
      return (
        <div>
          <h4 className="text-sm font-sm text-zinc-400 mb-1">Forma de Pagamento</h4>
          <div className="flex flex-col items-left gap-2 bg-purple-100 p-3 rounded-xl justify-between md:w-[55%] sm:max-w-[100%]">
            <p className="text-zinc-600">
              <span className="bg-white px-2 rounded-md font-medium text-purple-500">
                {subscription.paymentMethod.method}
              </span>
              {subscription.paymentMethod.details && (
                <span className="text-sm text-zinc-500 ml-2">{subscription.paymentMethod.details}</span>
              )}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  // Função para verificar se a assinatura pode ser cancelada
  if (loading) {
    return (
      <Card className="bg-zinc-100 border-zinc-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-50 border-zinc-200">
      <CardHeader>
        <CardTitle className="text-zinc-500">Minhas Assinaturas</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader className="animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : subscriptions.length > 0 ? (
          <>
            {/* Assinatura Ativa */}
            {activeSubscription && (
              <div className="mb-8">
                <div className="bg-white border border-zinc-100 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-zinc-500">
                      Assinatura Ativa
                    </h3>
                    <div className="flex items-center gap-2">
                      {activeSubscription.provider === 'lastlink' && (
                        <Badge variant="outline" className="border-purple-200 bg-purple-500/10 text-purple-500">
                          Lastlink
                        </Badge>
                      )}
                      <Badge className={getFormattedStatus(activeSubscription.status).color}>
                        {getFormattedStatus(activeSubscription.status).label}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4 text-[#b5b6c9]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Plano</h4>
                        <p className="text-zinc-600">{activeSubscription.planName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Valor</h4>
                        <p className="text-zinc-600">
                          {formatCurrency(
                            activeSubscription.amount || activeSubscription.price, 
                            activeSubscription.currency,
                            activeSubscription.provider === 'lastlink'
                          )}
                          /{getInterval(activeSubscription)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Período Atual</h4>
                        <p className="text-zinc-600">
                          {formatDate(activeSubscription.currentPeriodStart, activeSubscription.provider === 'lastlink')} - 
                          {formatDate(activeSubscription.currentPeriodEnd, activeSubscription.provider === 'lastlink')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Data de Adesão</h4>
                        <p className="text-zinc-600">
                          {formatDate(activeSubscription.created, activeSubscription.provider === 'lastlink')}
                        </p>
                      </div>
                    </div>

                    {renderPaymentMethod(activeSubscription)}
                    
                    {activeSubscription.provider === 'lastlink' && (
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Provedor de Pagamento</h4>
                        <div className="flex flex-col items-left gap-2 bg-purple-100 p-3 rounded-xl justify-between md:w-[55%] sm:max-w-[100%]">
                          <p className="text-zinc-600">
                            <span className="bg-white px-2 rounded-md font-medium text-purple-500">Lastlink</span>
                            <span className="font-medium ml-2">ID do pedido: {activeSubscription.orderId?.substring(0, 8)}...</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {activeSubscription.cancelAtPeriodEnd && (
                      <div className="mt-4">
                        <p className="text-red-500">
                          Assinatura será cancelada ao final do período
                        </p>
                      </div>
                    )}

                    {activeSubscription && (
                      <div className="mt-4">
                        <Button
                          onClick={() => setShowCancelDialog(true)}
                          variant="outline"
                          className="border-red-300 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                          disabled={loading}
                        >
                          Cancelar Assinatura
                        </Button>

                        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                          <AlertDialogContent className="bg-zinc-100 border-zinc-200 text-zinc-500">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Cancelamento da Assinatura</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-4">
                                <div className="bg-zinc-100 p-4 rounded-lg space-y-2">
                                  <h4 className="font-medium text-zinc-500">Detalhes da Assinatura</h4>
                                  <p>Plano: {activeSubscription.planName}</p>
                                  <p>Valor: {formatCurrency(
                                    activeSubscription.amount || activeSubscription.price,
                                    activeSubscription.currency,
                                    activeSubscription.provider === 'lastlink'
                                  )}/{getInterval(activeSubscription)}</p>
                                  <p>Período atual: {formatDate(activeSubscription.currentPeriodStart, activeSubscription.provider === 'lastlink')} - {formatDate(activeSubscription.currentPeriodEnd, activeSubscription.provider === 'lastlink')}</p>
                                </div>

                                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 p-4 rounded-lg">
                                  <strong>Atenção:</strong> Ao cancelar sua assinatura, você perderá todos os benefícios 
                                  dos cupons de desconto e acesso aos conteúdos exclusivos.
                                </div>

                                <RadioGroup
                                  value={cancelationType}
                                  onValueChange={(value: 'immediate' | 'end_of_period') => setCancelationType(value)}
                                  className="space-y-3"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="end_of_period" id="end_of_period" />
                                    <Label htmlFor="end_of_period" className="text-zinc-500">
                                      Cancelar renovação automática
                                      <p className="text-sm text-zinc-400">
                                        Mantenha acesso até {formatDate(activeSubscription.currentPeriodEnd, activeSubscription.provider === 'lastlink')}
                                      </p>
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="immediate" id="immediate" />
                                    <Label htmlFor="immediate" className="text-zinc-500">
                                      Cancelar imediatamente
                                      <p className="text-sm text-zinc-400">
                                        Você perderá o acesso instantaneamente
                                      </p>
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel 
                                className="bg-transparent border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                                disabled={cancelLoading}
                              >
                                Voltar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCancelSubscription}
                                className="bg-rose-500 hover:bg-rose-600 text-white"
                                disabled={cancelLoading}
                              >
                                {cancelLoading ? (
                                  <>
                                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                    Cancelando...
                                  </>
                                ) : (
                                  'Confirmar Cancelamento'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Histórico de Assinaturas */}
            <div className="mt-8">
              <div className="space-y-4">
                {subscriptions
                  .filter(sub => sub.status !== 'active')
                  .map((subscription) => (
                    <div
                      key={subscription.id}
                      className="bg-white border border-zinc-100 p-4 rounded-xl"
                    >
                      <h3 className="text-sm font-sm text-zinc-400/70 mb-4">
                        Histórico de Assinaturas
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-zinc-500 font-medium">
                          {subscription.planName}
                        </h4>
                        <Badge className={`${statusMap[subscription.status]?.color || 'bg-zinc-500'}`}>
                          {statusMap[subscription.status]?.label || formatStatus(subscription.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-zinc-400 space-y-1">
                        <p>
                          Valor:{' '}
                          {formatCurrency(
                            subscription.amount || subscription.price,
                            subscription.currency,
                            subscription.provider === 'lastlink'
                          )}
                          /{getInterval(subscription)}
                        </p>
                        <p>
                          Período: {formatDate(subscription.currentPeriodStart, subscription.provider === 'lastlink')} - {formatDate(subscription.currentPeriodEnd, subscription.provider === 'lastlink')}
                        </p>
                        {subscription.canceledAt && (
                          <p className="text-red-400">
                            Cancelada em: {formatDate(subscription.canceledAt, subscription.provider === 'lastlink')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Histórico de Transações */}
            {transactions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-sm text-zinc-400/70 mb-4">
                  Histórico de Transações
                </h3>
                <div className="rounded-xl border border-zinc-100 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-zinc-300">Data</TableHead>
                        <TableHead className="text-zinc-300">Descrição</TableHead>
                        <TableHead className="text-zinc-300">Valor</TableHead>
                        <TableHead className="text-zinc-300">Status</TableHead>
                        <TableHead className="text-zinc-300">Provedor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-zinc-500">
                            {formatDate(transaction.created, transaction.provider === 'lastlink')}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            {transaction.description || 'Pagamento de assinatura'}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            {formatCurrency(transaction.amount, transaction.currency, transaction.provider === 'lastlink')}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            {getFormattedStatus(transaction.status || 'unknown').label}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            <Badge variant={transaction.provider === 'lastlink' ? 'secondary' : 'default'}>
                              {formatProvider(transaction.provider)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            
            {hasOnlyCanceledSubscriptions && (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">
                  Você ainda não possui nenhuma assinatura ativa
                </p>
              </div>
            )}            
          </>
        ) : (
          <div className="text-center p-4 text-zinc-500">
            Nenhuma assinatura encontrada
          </div>
        )}
      </CardContent>
    </Card>
  )
} 