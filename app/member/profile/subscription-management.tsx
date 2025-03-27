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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// Extended interface to support both Stripe and Lastlink subscriptions
interface ExtendedSubscription extends StripeSubscription {
  provider?: 'stripe' | 'lastlink'
  orderId?: string
  planName?: string
  amount?: number
  currency?: string
  interval?: string
  intervalCount?: number
  created?: number
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const statusMap = {
  active: { label: 'Ativa', color: 'bg-green-500' },
  canceled: { label: 'Cancelada', color: 'bg-red-500' },
  incomplete: { label: 'Incompleta', color: 'bg-yellow-500' },
  incomplete_expired: { label: 'Expirada', color: 'bg-zinc-400' },
  past_due: { label: 'Atrasada', color: 'bg-orange-500' },
  trialing: { label: 'Teste', color: 'bg-blue-500' },
  unpaid: { label: 'Não paga', color: 'bg-red-500' },
}

const intervalMap = {
  month: 'mês',
  year: 'ano',
  week: 'semana',
  day: 'dia',
}

const cardBrandMap = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  jcb: 'JCB',
  diners: 'Diners Club',
  unionpay: 'Union Pay',
}

export function SubscriptionManagement({ userId }: { userId: string }) {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<ExtendedSubscription[]>([])
  const [transactions, setTransactions] = useState<StripeTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState<any[]>([])
  const [showPricesDialog, setShowPricesDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelationType, setCancelationType] = useState<'immediate' | 'end_of_period'>('end_of_period')
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchSubscriptionData()
      fetchPrices()
    }
  }, [userId])

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      const email = user?.email || ''
      
      // Array para armazenar todas as assinaturas (Stripe + Lastlink)
      let allSubscriptions: any[] = []
      let allTransactions: any[] = []

      // 1. Buscar assinaturas do Stripe
      const stripeResponse = await fetch(`/api/user/subscription?userId=${userId}&email=${encodeURIComponent(email)}`)
      
      if (stripeResponse.ok) {
        const stripeData = await stripeResponse.json()
        console.log('Dados de assinatura Stripe recebidos:', stripeData)
        
        // Adicionar assinaturas do Stripe ao array
        if (stripeData.subscriptions && stripeData.subscriptions.length > 0) {
          allSubscriptions = [...stripeData.subscriptions]
        }
        
        // Adicionar transações do Stripe ao array
        if (stripeData.transactions && stripeData.transactions.length > 0) {
          allTransactions = [...stripeData.transactions]
        }
      }
      
      // 2. Buscar assinaturas do Lastlink
      const lastlinkResponse = await fetch(`/api/user/subscription/lastlink?userId=${userId}&email=${encodeURIComponent(email)}`)
      
      if (lastlinkResponse.ok) {
        const lastlinkData = await lastlinkResponse.json()
        console.log('Dados de assinatura Lastlink recebidos:', lastlinkData)
        
        // Converter assinaturas do Lastlink para o formato compatível com o componente
        if (lastlinkData.subscriptions && lastlinkData.subscriptions.length > 0) {
          const formattedLastlinkSubscriptions = lastlinkData.subscriptions.map(sub => {
            // Obter detalhes do pagamento se disponível
            const paymentDetails = sub.paymentDetails || {}
            const now = new Date()
            const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias no futuro como fallback
            const createdAtDate = new Date(sub.createdAt || now)
            
            // Converter para o formato esperado pelo componente
            return {
              id: sub.id,
              status: sub.status || 'active',
              planName: paymentDetails.planName || 'Plano Premium',
              amount: paymentDetails.amount || 9900, // Valor em centavos
              currency: 'BRL',
              interval: paymentDetails.planInterval || 'month',
              intervalCount: paymentDetails.planIntervalCount || 1,
              paymentProvider: 'lastlink',
              currentPeriodStart: Math.floor(createdAtDate.getTime() / 1000),
              currentPeriodEnd: Math.floor(expiresAt.getTime() / 1000),
              created: Math.floor(createdAtDate.getTime() / 1000),
              cancelAtPeriodEnd: false,
              // Adicionar informações do provedor
              provider: 'lastlink',
              orderId: sub.orderId
            }
          })
          
          // Adicionar assinaturas do Lastlink ao array
          allSubscriptions = [...allSubscriptions, ...formattedLastlinkSubscriptions]
        }
        
        // Converter pagamentos do Lastlink para o formato compatível com o componente
        if (lastlinkData.payments && lastlinkData.payments.length > 0) {
          const formattedLastlinkTransactions = lastlinkData.payments.map(payment => {
            const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date()
            
            return {
              id: payment.id,
              amount: payment.amount || 0,
              currency: 'BRL',
              status: payment.status || 'succeeded',
              created: Math.floor(paidAt.getTime() / 1000),
              description: `Pagamento ${payment.planName || 'Premium'} - Lastlink`,
              provider: 'lastlink'
            }
          })
          
          // Adicionar transações do Lastlink ao array
          allTransactions = [...allTransactions, ...formattedLastlinkTransactions]
        }
      }
      
      // Ordenar as assinaturas: ativas primeiro, depois por data de criação (mais recentes primeiro)
      allSubscriptions.sort((a, b) => {
        // Priorizar assinaturas ativas
        if (a.status === 'active' && b.status !== 'active') return -1
        if (a.status !== 'active' && b.status === 'active') return 1
        
        // Em seguida, ordenar por data (mais recente primeiro)
        return b.created - a.created
      })
      
      // Ordenar transações por data (mais recentes primeiro)
      allTransactions.sort((a, b) => b.created - a.created)
      
      console.log('Assinaturas consolidadas:', allSubscriptions.length)
      console.log('Transações consolidadas:', allTransactions.length)
      
      // Atualizar estado com dados combinados
      setSubscriptions(allSubscriptions)
      setTransactions(allTransactions)
    } catch (error) {
      console.error('Erro ao buscar dados da assinatura:', error)
      toast.error('Erro ao carregar dados da assinatura')
    } finally {
      setLoading(false)
    }
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
  const activeSubscription = subscriptions.find(sub => sub.status === 'active') as ExtendedSubscription | undefined
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

  if (loading) {
    return (
      <Card className="bg-zinc-100 border-zinc-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <p className="text-zinc-500">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-50 border-zinc-100">
      <CardHeader>
        <CardTitle className="text-zinc-500">Gestão de Assinatura</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <p className="text-zinc-400">Carregando...</p>
          </div>
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
                      <Badge className={`${statusMap[activeSubscription.status].color}`}>
                        {statusMap[activeSubscription.status].label}
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
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: activeSubscription.currency,
                          }).format(activeSubscription.amount / 100)}
                          /{intervalMap[activeSubscription.interval] || 'mês'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Período Atual</h4>
                        <p className="text-zinc-600">
                          {format(activeSubscription.currentPeriodStart * 1000, "dd/MM/yyyy", { locale: ptBR })} - {format(activeSubscription.currentPeriodEnd * 1000, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Data de Adesão</h4>
                        <p className="text-zinc-600">{format(activeSubscription.created * 1000, "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    </div>

                    {activeSubscription.paymentMethod && (
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Forma de Pagamento</h4>
                        <div className="flex flex-col items-left gap-2 bg-zinc-100 p-3 rounded-xl justify-between md:w-[55%] sm:max-w-[100%]">
                          <p className="text-zinc-600">
                            <span className="bg-white px-2 rounded-md font-medium text-indigo-400">{cardBrandMap[activeSubscription.paymentMethod.brand] || activeSubscription.paymentMethod.brand}</span> <span className="font-medium"> **** **** **** {activeSubscription.paymentMethod.last4}</span>
                          </p>
                          <p className="text-sm text-zinc-400">
                          Exp date: {String(activeSubscription.paymentMethod.expiryMonth).padStart(2, '0')}/{activeSubscription.paymentMethod.expiryYear}
                          </p>
                        </div>
                      </div>
                    )}
                    
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
                                  <p>Valor: {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: activeSubscription.currency,
                                  }).format(activeSubscription.amount / 100)}/{activeSubscription.interval}</p>
                                  <p>Período atual: {format(activeSubscription.currentPeriodStart * 1000, "dd/MM/yyyy")} - {format(activeSubscription.currentPeriodEnd * 1000, "dd/MM/yyyy")}</p>
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
                                        Mantenha acesso até {format(activeSubscription.currentPeriodEnd * 1000, "dd/MM/yyyy")}
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
                                {cancelLoading ? "Cancelando..." : "Confirmar Cancelamento"}
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
                        <Badge className={`${statusMap[subscription.status].color}`}>
                          {statusMap[subscription.status].label}
                        </Badge>
                      </div>
                      <div className="text-sm text-zinc-400 space-y-1">
                        <p>
                          Valor:{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: subscription.currency,
                          }).format(subscription.amount / 100)}
                          /{subscription.interval}
                        </p>
                        <p>
                          Período: {format(subscription.currentPeriodStart * 1000, "dd/MM/yyyy")} - {format(subscription.currentPeriodEnd * 1000, "dd/MM/yyyy")}
                        </p>
                        {subscription.canceledAt && (
                          <p className="text-red-400">
                            Cancelada em: {format(subscription.canceledAt * 1000, "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Histórico de Transações */}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-zinc-500">
                          {format(transaction.created * 1000, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-zinc-500">
                          {transaction.description || 'Pagamento de assinatura'}
                        </TableCell>
                        <TableCell className="text-zinc-500">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: transaction.currency,
                          }).format(transaction.amount / 100)}
                        </TableCell>
                        <TableCell className="text-zinc-500">
                          {transaction.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            
            {hasOnlyCanceledSubscriptions && (
              
            <div className="text-center py-8">
              <p className="text-zinc-400 mb-4">
                Você ainda não possui nenhuma assinatura ativa
              </p>
            </div>
            )}            
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-400 mb-4">
              Você ainda não possui nenhuma assinatura ativa
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  )
} 