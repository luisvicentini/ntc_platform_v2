"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Loader } from "@/components/ui/loader"
import { formatCurrency } from "@/lib/utils"

interface LastlinkPaymentMethod {
  method: string;
  details?: string;
}

interface LastlinkSubscription {
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
  orderId?: string;
  paymentMethod?: LastlinkPaymentMethod;
  paymentDetails?: {
    description?: string;
    planName?: string;
    amount?: number;
    planInterval?: string;
    planIntervalCount?: number;
  };
  createdAt: string;
  nextPaymentDate?: string;
  canceledAt?: string;
}

interface LastlinkTransaction {
  id: string;
  amount: number;
  created: number;
  status: string;
  currency: string;
  description?: string;
  planName?: string;
  paidAt?: string;
}

type StatusInfo = {
  color: string;
  label: string;
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
  | 'succeeded'
  | 'failed'
  | 'pending';

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
  'succeeded': { color: 'bg-green-500', label: 'Concluído' },
  'failed': { color: 'bg-red-500', label: 'Falhou' },
  'pending': { color: 'bg-yellow-500', label: 'Pendente' }
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
            
            return {
              id: sub.id,
              status: sub.status || 'active',
              planName: paymentDetails.planName || 'Plano Premium',
              amount: paymentDetails.amount || 9900,
              currency: 'BRL',
              interval: paymentDetails.planInterval || 'month',
              intervalCount: paymentDetails.planIntervalCount || 1,
              currentPeriodStart: Math.floor(createdAtDate.getTime() / 1000),
              currentPeriodEnd: Math.floor(expiresAt.getTime() / 1000),
              created: Math.floor(createdAtDate.getTime() / 1000),
              orderId: sub.orderId,
              paymentMethod: {
                method: sub.paymentMethod || 'Cartão de Crédito',
                details: sub.paymentDetails?.description
              },
              paymentDetails,
              createdAt: sub.createdAt || now.toISOString(),
              nextPaymentDate: sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toISOString() : undefined,
              canceledAt: sub.canceledAt ? new Date(sub.canceledAt).toISOString() : undefined
            }
          })
          
          setSubscriptions(lastlinkSubscriptions)
        }
        
        if (data.payments) {
          // Converter pagamentos do Lastlink
          const lastlinkTransactions = data.payments.map((payment: any) => {
            const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date()
            
            return {
              id: payment.id,
              amount: payment.amount || 0,
              currency: 'BRL',
              status: payment.status || 'succeeded',
              created: Math.floor(paidAt.getTime() / 1000),
              description: `Pagamento ${payment.planName || 'Premium'} - Lastlink`,
              planName: payment.planName,
              paidAt: payment.paidAt
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

  // Pegar a assinatura ativa (se houver)
  const activeSubscription = subscriptions.find(sub => 
    sub.status === 'active' || sub.status === 'ativa' || sub.status === 'iniciada'
  )
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
        <CardTitle className="text-zinc-500">Minha Assinatura Lastlink</CardTitle>
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-purple-200 bg-purple-500/10 text-purple-500">
                        Lastlink
                      </Badge>
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
                          {formatCurrency(activeSubscription.amount)}
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
                          {formatCurrency(subscription.amount)}
                          /{subscription.interval}
                        </p>
                        <p>
                          Período: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                        </p>
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
                            {formatDate(transaction.created)}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            {transaction.description || 'Pagamento de assinatura'}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            {getFormattedStatus(transaction.status).label}
                          </TableCell>
                          <TableCell className="text-zinc-500">
                            <Badge variant="secondary">
                              Lastlink
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