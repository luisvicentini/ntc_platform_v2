"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Loader } from "@/components/ui/loader"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from "@/lib/utils/utils"

// Base interface for transactions
interface BaseTransaction {
  id: string
  amount: number
  price?: number
  currency?: string
  created?: number
  description?: string
  status?: string
  provider?: 'stripe' | 'lastlink'
}

// Extended interface for Lastlink transactions
interface LastlinkTransaction extends BaseTransaction {
  orderId?: string
  planId?: string
  planName?: string
  paidAt?: string
}

// Base interface for subscriptions
interface BaseSubscription {
  id: string
  provider?: 'stripe' | 'lastlink'
  orderId?: string
  planName?: string
  amount?: number
  price?: number
  currency?: string
  interval?: string
  intervalCount?: number
  created?: number
  currentPeriodStart?: number
  currentPeriodEnd?: number
  canceledAt?: number
  status?: string
  cancelAtPeriodEnd?: boolean
  paymentMethod?: {
    method: string
    details?: string
  }
}

// Extended interface for Lastlink subscriptions
interface LastlinkSubscription extends BaseSubscription {
  planId?: string
  partnerId?: string
  nextPaymentDate?: string
  paymentDetails?: {
    description?: string
    planName?: string
    amount?: number
    planInterval?: string
    planIntervalCount?: number
  }
}

type StatusInfo = {
  color: string
  label: string
}

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

type IntervalKey = 'month' | 'year' | 'week' | 'day'

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
  'unknown': { color: 'bg-zinc-500', label: 'Desconhecido' }
}

const intervalMap: Record<IntervalKey, string> = {
  'month': 'mês',
  'year': 'ano',
  'week': 'semana',
  'day': 'dia'
}

interface LastlinkSubscriptionManagementProps {
  userId: string
}

export function LastlinkSubscriptionManagement({ userId }: LastlinkSubscriptionManagementProps) {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<LastlinkSubscription[]>([])
  const [transactions, setTransactions] = useState<LastlinkTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      const email = user?.email || ''
      
      const response = await fetch(`/api/user/subscription/lastlink?userId=${userId}&email=${encodeURIComponent(email)}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dados de assinatura Lastlink recebidos:', data)
        
        if (data.subscriptions) {
          // Converter assinaturas do Lastlink para o formato compatível
          const lastlinkSubscriptions = data.subscriptions.map((sub: any) => {
            const paymentDetails = sub.paymentDetails || {}
            const now = new Date()
            const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            const createdAtDate = new Date(sub.createdAt || now)
            
            // Corrigir o valor: se o valor estiver no formato xxx.yy (ponto como separador decimal), 
            // consideramos que ele já está no formato correto e não precisamos dividir por 100
            const amount = parseFloat(String(sub.amount || paymentDetails.amount || 0))
            
            return {
              id: sub.id,
              provider: 'lastlink',
              status: sub.status || 'active',
              planName: sub.planName || paymentDetails.planName || 'Plano Premium',
              amount: amount,
              currency: 'BRL',
              interval: sub.planInterval || paymentDetails.planInterval || 'month',
              intervalCount: sub.planIntervalCount || paymentDetails.planIntervalCount || 1,
              currentPeriodStart: Math.floor(createdAtDate.getTime() / 1000),
              currentPeriodEnd: Math.floor(expiresAt.getTime() / 1000),
              created: Math.floor(createdAtDate.getTime() / 1000),
              orderId: sub.orderId,
              paymentMethod: {
                method: sub.paymentMethod || 'Cartão de Crédito',
                details: sub.paymentDetails?.description
              },
              paymentDetails,
              nextPaymentDate: sub.nextPaymentDate,
              canceledAt: sub.canceledAt ? Math.floor(new Date(sub.canceledAt).getTime() / 1000) : undefined
            }
          })
          
          setSubscriptions(lastlinkSubscriptions)
        }
        
        if (data.payments) {
          // Converter pagamentos do Lastlink
          const lastlinkTransactions = data.payments.map((payment: any) => {
            const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date()
            // Corrigir o valor: se o valor estiver no formato xxx.yy (ponto como separador decimal),
            // consideramos que ele já está no formato correto
            const amount = parseFloat(String(payment.amount || 0))
            
            return {
              id: payment.id,
              provider: 'lastlink',
              amount: amount,
              currency: 'BRL',
              status: payment.status || 'succeeded',
              created: Math.floor(paidAt.getTime() / 1000),
              description: `Pagamento ${payment.planName || 'Premium'} - Lastlink`,
              planName: payment.planName,
              paidAt: payment.paidAt,
              orderId: payment.orderId
            }
          })
          
          setTransactions(lastlinkTransactions)
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
  const formatDate = (timestamp: number | undefined): string => {
    if (!timestamp) return '-'
    try {
      return format(new Date(timestamp * 1000), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      console.error("Erro ao formatar data:", error, timestamp)
      return '-'
    }
  }

  const getFormattedStatus = (subscription: LastlinkSubscription | null): StatusInfo => {
    if (!subscription) return statusMap.unknown
    const status = subscription.status || 'unknown'
    const statusKey = Object.keys(statusMap).includes(status) ? status as StatusKey : 'unknown'
    return statusMap[statusKey]
  }

  const getInterval = (subscription: LastlinkSubscription | null): string => {
    if (!subscription) return intervalMap.month
    const interval = subscription.interval || 'month'
    const intervalKey = Object.keys(intervalMap).includes(interval) ? interval as IntervalKey : 'month'
    return intervalMap[intervalKey]
  }

  // Formatar valor para exibição
  const formatAmount = (amount: number): string => {
    // Na Lastlink, o valor já vem formatado corretamente (ex: 598.80 representa R$ 598,80)
    // Não precisamos dividir por 100 como no Stripe
    try {
      return formatCurrency(amount)
    } catch (error) {
      console.error("Erro ao formatar valor:", error, amount)
      return `R$ ${amount.toFixed(2)}`
    }
  }

  // Criar transação simulada se não houver nenhuma
  const ensureTransactions = (subscriptions: LastlinkSubscription[], transactions: LastlinkTransaction[]): LastlinkTransaction[] => {
    if (transactions.length > 0) {
      return transactions;
    }
    
    // Se não temos transações mas temos assinaturas, criar uma transação simulada com base na assinatura ativa
    const activeSubscription = subscriptions.find(sub => 
      sub.status === 'active' || sub.status === 'ativa' || sub.status === 'iniciada'
    );
    
    if (activeSubscription) {
      console.log('Criando transação simulada baseada na assinatura ativa:', activeSubscription);
      return [{
        id: `simulate_${activeSubscription.id}`,
        provider: 'lastlink',
        amount: activeSubscription.amount || 0,
        currency: 'BRL',
        status: 'succeeded',
        created: activeSubscription.created || Math.floor(Date.now() / 1000),
        description: `Assinatura ${activeSubscription.planName || 'Premium'} - Lastlink`,
        planName: activeSubscription.planName,
        orderId: activeSubscription.orderId
      }];
    }
    
    return [];
  }

  // Pegar a assinatura ativa (se houver)
  const activeSubscription = subscriptions.find(sub => 
    sub.status === 'active' || sub.status === 'ativa' || sub.status === 'iniciada'
  )
  const hasOnlyCanceledSubscriptions = subscriptions.length > 0 && !activeSubscription

  // Garantir que temos transações para exibir
  const displayTransactions = ensureTransactions(subscriptions, transactions);

  if (loading) {
    return (
      <Card className="">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>  
      <CardHeader className="pt-4 pb-4 pr-0 pl-0">
        <CardTitle className="text-zinc-500">Minha Assinatura Lastlink</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : subscriptions.length > 0 ? (
          <>
            {/* Assinatura Ativa */}
            {activeSubscription && (
              <div className="mb-8">
                <div className="bg-white border border-zinc-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-zinc-500">
                      Assinatura Ativa
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-purple-200 bg-purple-500/10 text-purple-500">
                        Lastlink
                      </Badge>
                      <Badge className={getFormattedStatus(activeSubscription).color}>
                        {getFormattedStatus(activeSubscription).label}
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
                          {formatAmount(activeSubscription.amount || 0)}
                          /{getInterval(activeSubscription)}
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
                        <div className="flex flex-col items-left gap-2 bg-purple-100 p-3 rounded-xl justify-between md:w-[55%] sm:max-w-[100%]">
                          <p className="text-zinc-600">
                            <span className="bg-white px-2 rounded-md font-medium text-purple-500">
                              {activeSubscription.paymentMethod.method}
                            </span>
                            {activeSubscription.paymentMethod.details && (
                              <span className="text-sm text-zinc-500 ml-2">
                                {activeSubscription.paymentMethod.details}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-sm text-zinc-400 mb-1">Provedor de Pagamento</h4>
                      <div className="flex flex-col items-left gap-2 bg-purple-100 p-3 rounded-xl justify-between md:w-[55%] sm:max-w-[100%]">
                        <p className="text-zinc-600">
                          <span className="bg-white px-2 rounded-md font-medium text-purple-500">Lastlink</span>
                          <span className="font-medium ml-2">ID do pedido: {activeSubscription.orderId?.substring(0, 8)}...</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Histórico de Assinaturas */}
            <div className="mt-8">
              <div className="space-y-4">
                {subscriptions
                  .filter(sub => sub.status !== 'active' && sub.status !== 'ativa' && sub.status !== 'iniciada')
                  .map((subscription) => (
                    <div
                      key={subscription.id}
                      className="bg-white border border-zinc-200 p-4 rounded-xl"
                    >
                      <h3 className="text-sm font-sm text-zinc-400/70 mb-4">
                        Histórico de Assinaturas
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-zinc-500 font-medium">
                          {subscription.planName}
                        </h4>
                        <Badge className={getFormattedStatus(subscription).color}>
                          {getFormattedStatus(subscription).label}
                        </Badge>
                      </div>
                      <div className="text-sm text-zinc-400 space-y-1">
                        <p>
                          Valor:{' '}
                          {formatAmount(subscription.amount || 0)}
                          /{getInterval(subscription)}
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
            {displayTransactions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-sm text-zinc-400/70 mb-4">
                  Histórico de Transações
                </h3>
                <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-zinc-300">Data</TableHead>
                        <TableHead className="text-zinc-300">Descrição</TableHead>
                        <TableHead className="text-zinc-300">Valor</TableHead>
                        <TableHead className="text-zinc-300">Status</TableHead>
                        <TableHead className="text-zinc-300">ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="bg-white">
                          <TableCell className="text-zinc-600 font-medium">
                            {formatDate(transaction.created)}
                          </TableCell>
                          <TableCell className="text-zinc-600">
                            {transaction.description || `Assinatura ${transaction.planName || 'Premium'}`}
                          </TableCell>
                          <TableCell className="text-zinc-600 font-medium">
                            {formatAmount(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-zinc-600">
                            <Badge 
                              className={
                                transaction.status === 'succeeded' || transaction.status === 'active' 
                                ? 'bg-green-500' 
                                : 'bg-yellow-500'
                              }
                            >
                              {transaction.status === 'succeeded' ? 'Concluído' : getFormattedStatus({ status: transaction.status } as LastlinkSubscription).label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-500 font-mono text-xs">
                            {transaction.orderId ? transaction.orderId.substring(0, 8) : transaction.id.substring(0, 8)}...
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
    </>
  )
} 