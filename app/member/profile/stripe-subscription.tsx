"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader } from "@/components/ui/loader"
import { Loader2Icon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

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

interface StripePaymentMethod {
  brand: CardBrand;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}

interface StripeSubscription {
  id: string;
  status: string;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  created: number;
  cancelAtPeriodEnd: boolean;
  canceledAt?: number;
  paymentMethod?: StripePaymentMethod;
}

interface StripeTransaction {
  id: string;
  amount: number;
  created: number;
  status: string;
  currency: string;
  description?: string;
}

type StatusInfo = {
  color: string;
  label: string;
}

type StatusKey = 
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
  | 'succeeded'
  | 'failed'
  | 'pending';

const statusMap: Record<StatusKey, StatusInfo> = {
  'active': { color: 'bg-green-500', label: 'Ativa' },
  'canceled': { color: 'bg-red-500', label: 'Cancelada' },
  'incomplete': { color: 'bg-yellow-500', label: 'Incompleta' },
  'incomplete_expired': { color: 'bg-red-500', label: 'Expirada' },
  'past_due': { color: 'bg-yellow-500', label: 'Atrasada' },
  'trialing': { color: 'bg-blue-500', label: 'Teste' },
  'unpaid': { color: 'bg-red-500', label: 'Não paga' },
  'succeeded': { color: 'bg-green-500', label: 'Concluído' },
  'failed': { color: 'bg-red-500', label: 'Falhou' },
  'pending': { color: 'bg-yellow-500', label: 'Pendente' }
}

interface StripeSubscriptionManagementProps {
  userId: string
}

export function StripeSubscriptionManagement({ userId }: StripeSubscriptionManagementProps) {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([])
  const [transactions, setTransactions] = useState<StripeTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelationType, setCancelationType] = useState<'immediate' | 'end_of_period'>('end_of_period')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<StripeSubscription | null>(null)

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      const email = user?.email || ''
      
      const response = await fetch(`/api/user/subscription?userId=${userId}&email=${encodeURIComponent(email)}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dados de assinatura Stripe recebidos:', data)
        
        if (data.subscriptions) {
          setSubscriptions(data.subscriptions)
        }
        
        if (data.transactions) {
          setTransactions(data.transactions)
        }
      }
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
    }
  }, [userId])

  // Funções auxiliares
  const formatDate = (timestamp: number): string => {
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

  const getFormattedStatus = (status: string): StatusInfo => {
    const normalizedStatus = status.toLowerCase() as StatusKey
    return statusMap[normalizedStatus] || { color: 'bg-zinc-500', label: 'Desconhecido' }
  }

  const formatCardBrand = (brand: CardBrand): string => {
    return cardBrandMap[brand] || brand
  }

  const handleCancelSubscription = async () => {
    const activeSubscription = subscriptions.find(sub => sub.status === 'active')
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

      await fetchSubscriptionData()
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

  // Pegar a assinatura ativa (se houver)
  const activeSubscription = subscriptions.find(sub => sub.status === 'active')
  const hasOnlyCanceledSubscriptions = subscriptions.length > 0 && !activeSubscription

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
        {error ? (
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
                    <Badge className={getFormattedStatus(activeSubscription.status).color}>
                      {getFormattedStatus(activeSubscription.status).label}
                    </Badge>
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
                          {formatCurrency(activeSubscription.amount, activeSubscription.currency)}
                          /{activeSubscription.interval}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Período Atual</h4>
                        <p className="text-zinc-600">
                          {formatDate(activeSubscription.currentPeriodStart)} - 
                          {formatDate(activeSubscription.currentPeriodEnd)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Data de Adesão</h4>
                        <p className="text-zinc-600">
                          {formatDate(activeSubscription.created)}
                        </p>
                      </div>
                    </div>

                    {activeSubscription.paymentMethod && (
                      <div>
                        <h4 className="text-sm font-sm text-zinc-400 mb-1">Forma de Pagamento</h4>
                        <div className="flex flex-col items-left gap-2 bg-zinc-100 p-3 rounded-xl justify-between md:w-[55%] sm:max-w-[100%]">
                          <p className="text-zinc-600">
                            <span className="bg-white px-2 rounded-md font-medium text-indigo-400">
                              {formatCardBrand(activeSubscription.paymentMethod.brand)}
                            </span>
                            <span className="font-medium"> **** **** **** {activeSubscription.paymentMethod.last4}</span>
                          </p>
                          <p className="text-sm text-zinc-400">
                            Exp date: {String(activeSubscription.paymentMethod.expiryMonth).padStart(2, '0')}/{activeSubscription.paymentMethod.expiryYear}
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
                                <p>Valor: {formatCurrency(activeSubscription.amount, activeSubscription.currency)}/{activeSubscription.interval}</p>
                                <p>Período atual: {formatDate(activeSubscription.currentPeriodStart)} - {formatDate(activeSubscription.currentPeriodEnd)}</p>
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
                                      Mantenha acesso até {formatDate(activeSubscription.currentPeriodEnd)}
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
                        <Badge className={getFormattedStatus(subscription.status).color}>
                          {getFormattedStatus(subscription.status).label}
                        </Badge>
                      </div>
                      <div className="text-sm text-zinc-400 space-y-1">
                        <p>
                          Valor:{' '}
                          {formatCurrency(subscription.amount, subscription.currency)}
                          /{subscription.interval}
                        </p>
                        <p>
                          Período: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                        </p>
                        {subscription.canceledAt && (
                          <p className="text-red-400">
                            Cancelada em: {formatDate(subscription.canceledAt)}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-zinc-500">
                            {formatDate(transaction.created)}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            {transaction.description || 'Pagamento de assinatura'}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            {getFormattedStatus(transaction.status).label}
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