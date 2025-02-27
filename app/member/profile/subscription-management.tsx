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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const statusMap = {
  active: { label: 'Ativa', color: 'bg-green-500' },
  canceled: { label: 'Cancelada', color: 'bg-red-500' },
  incomplete: { label: 'Incompleta', color: 'bg-yellow-500' },
  incomplete_expired: { label: 'Expirada', color: 'bg-gray-500' },
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
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([])
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
      const response = await fetch(`/api/user/subscription?userId=${userId}`)
      const data = await response.json()
      setSubscriptions(data.subscriptions)
      setTransactions(data.transactions)
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
  const activeSubscription = subscriptions.find(sub => sub.status === 'active')
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
      <Card className="bg-[#131320] border-[#1a1b2d]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <p className="text-[#e5e2e9]">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#131320] border-[#1a1b2d]">
      <CardHeader>
        <CardTitle className="text-[#e5e2e9]">Gestão de Assinatura</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <p className="text-[#7a7b9f]">Carregando...</p>
          </div>
        ) : subscriptions.length > 0 ? (
          <>
            {/* Assinatura Ativa */}
            {activeSubscription && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#e5e2e9] mb-4">
                  Assinatura Atual
                </h3>
                <div className="bg-[#1a1b2d] p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-semibold text-[#e5e2e9]">
                      Detalhes da Assinatura
                    </h4>
                    <Badge className={`${statusMap[activeSubscription.status].color}`}>
                      {statusMap[activeSubscription.status].label}
                    </Badge>
                  </div>
                  <div className="space-y-4 text-[#b5b6c9]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-[#7a7b9f] mb-1">Plano</h4>
                        <p className="text-[#e5e2e9]">{activeSubscription.planName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-[#7a7b9f] mb-1">Valor</h4>
                        <p className="text-[#e5e2e9]">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: activeSubscription.currency,
                          }).format(activeSubscription.amount / 100)}
                          /{intervalMap[activeSubscription.interval]}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-[#7a7b9f] mb-1">Período Atual</h4>
                        <p>
                          {format(activeSubscription.currentPeriodStart * 1000, "dd/MM/yyyy", { locale: ptBR })} - {format(activeSubscription.currentPeriodEnd * 1000, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-[#7a7b9f] mb-1">Data de Adesão</h4>
                        <p>{format(activeSubscription.created * 1000, "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    </div>

                    {activeSubscription.paymentMethod && (
                      <div>
                        <h4 className="text-sm font-medium text-[#7a7b9f] mb-1">Forma de Pagamento</h4>
                        <p>
                          {cardBrandMap[activeSubscription.paymentMethod.brand] || activeSubscription.paymentMethod.brand} terminando em {activeSubscription.paymentMethod.last4}
                        </p>
                        <p className="text-sm text-[#7a7b9f]">
                          Expira em {String(activeSubscription.paymentMethod.expiryMonth).padStart(2, '0')}/{activeSubscription.paymentMethod.expiryYear}
                        </p>
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
                          className="text-rose-500 hover:bg-rose-500/10"
                          disabled={loading}
                        >
                          Cancelar Assinatura
                        </Button>

                        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                          <AlertDialogContent className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Cancelamento da Assinatura</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-4">
                                <div className="bg-[#1a1b2d] p-4 rounded-lg space-y-2">
                                  <h4 className="font-medium text-[#e5e2e9]">Detalhes da Assinatura</h4>
                                  <p>Plano: {activeSubscription.planName}</p>
                                  <p>Valor: {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: activeSubscription.currency,
                                  }).format(activeSubscription.amount / 100)}/{activeSubscription.interval}</p>
                                  <p>Período atual: {format(activeSubscription.currentPeriodStart * 1000, "dd/MM/yyyy")} - {format(activeSubscription.currentPeriodEnd * 1000, "dd/MM/yyyy")}</p>
                                </div>

                                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-4 rounded-lg">
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
                                    <Label htmlFor="end_of_period" className="text-[#e5e2e9]">
                                      Cancelar renovação automática
                                      <p className="text-sm text-[#7a7b9f]">
                                        Mantenha acesso até {format(activeSubscription.currentPeriodEnd * 1000, "dd/MM/yyyy")}
                                      </p>
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="immediate" id="immediate" />
                                    <Label htmlFor="immediate" className="text-[#e5e2e9]">
                                      Cancelar imediatamente
                                      <p className="text-sm text-[#7a7b9f]">
                                        Você perderá o acesso instantaneamente
                                      </p>
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel 
                                className="bg-transparent border-[#1a1b2d] text-[#e5e2e9] hover:bg-[#1a1b2d]"
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
              <h3 className="text-lg font-semibold text-[#e5e2e9] mb-4">
                Histórico de Assinaturas
              </h3>
              <div className="space-y-4">
                {subscriptions
                  .filter(sub => sub.status !== 'active')
                  .map((subscription) => (
                    <div
                      key={subscription.id}
                      className="bg-[#1a1b2d] p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[#e5e2e9] font-medium">
                          {subscription.planName}
                        </h4>
                        <Badge className={`${statusMap[subscription.status].color}`}>
                          {statusMap[subscription.status].label}
                        </Badge>
                      </div>
                      <div className="text-sm text-[#7a7b9f] space-y-1">
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
              <h3 className="text-lg font-semibold text-[#e5e2e9] mb-4">
                Histórico de Transações
              </h3>
              <div className="rounded-md border border-[#1a1b2d]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[#7a7b9f]">Data</TableHead>
                      <TableHead className="text-[#7a7b9f]">Descrição</TableHead>
                      <TableHead className="text-[#7a7b9f]">Valor</TableHead>
                      <TableHead className="text-[#7a7b9f]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-[#e5e2e9]">
                          {format(transaction.created * 1000, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-[#e5e2e9]">
                          {transaction.description || 'Pagamento de assinatura'}
                        </TableCell>
                        <TableCell className="text-[#e5e2e9]">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: transaction.currency,
                          }).format(transaction.amount / 100)}
                        </TableCell>
                        <TableCell className="text-[#e5e2e9]">
                          {transaction.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {hasOnlyCanceledSubscriptions && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setShowPricesDialog(true)}
                  className="bg-[#7435db] hover:bg-[#a85fdd] text-white"
                >
                  Assinar Novamente
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#7a7b9f] mb-4">
              Você ainda não possui nenhuma assinatura
            </p>
            <Button
              onClick={() => setShowPricesDialog(true)}
              className="bg-[#7435db] hover:bg-[#a85fdd] text-white"
              disabled={loading}
            >
              Assinar Agora
            </Button>
          </div>
        )}

        <Dialog open={showPricesDialog} onOpenChange={setShowPricesDialog}>
          <DialogContent className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]">
            <DialogHeader>
              <DialogTitle>Escolha seu plano</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {prices.map((price) => (
                <div
                  key={price.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#1a1b2d]"
                >
                  <div>
                    <h4 className="font-medium">{price.product.name}</h4>
                    <p className="text-sm text-[#7a7b9f]">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: price.currency,
                      }).format(price.unit_amount / 100)}
                      /{price.recurring.interval}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      handleSubscribe(price.id)
                      setShowPricesDialog(false)
                    }}
                    className="bg-[#7435db] hover:bg-[#a85fdd] text-white"
                    disabled={loading}
                  >
                    Selecionar
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 