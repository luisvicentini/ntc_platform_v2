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
import { useSubscription } from '@/contexts/subscription-context'

// Base interface for transactions
interface ManualTransaction {
  id: string
  amount: number
  currency?: string
  created?: number
  description?: string
  status?: string
  provider?: 'manual' | 'admin_panel'
  planName?: string
  orderId?: string
}

// Base interface for subscriptions
interface ManualSubscription {
  id: string
  provider?: 'manual' | 'admin_panel'
  type?: 'manual'
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
  paymentMethod?: string
  partnerId?: string
  userEmail?: string
  userId?: string
  startDate?: string
  endDate?: string
  createdAt?: string
  updatedAt?: string
  expiresAt?: string
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

interface ManualSubscriptionManagementProps {
  userId: string
}

export function ManualSubscriptionManagement({ userId }: ManualSubscriptionManagementProps) {
  const { user } = useAuth()
  const { getMemberSubscriptions } = useSubscription()
  const [subscriptions, setSubscriptions] = useState<ManualSubscription[]>([])
  const [transactions, setTransactions] = useState<ManualTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      console.log('Buscando assinaturas manuais para o usuário:', userId)
      
      try {
        // Usar o contexto de assinatura para obter todas as assinaturas
        const allSubscriptions = await getMemberSubscriptions(userId)
        console.log('Todas as assinaturas encontradas:', allSubscriptions.length)
        
        // Filtrar apenas assinaturas manuais
        const manualSubs = allSubscriptions.filter(sub => 
          sub.provider === 'manual' || 
          sub.provider === 'admin_panel' || 
          sub.type === 'manual' || 
          sub.paymentMethod === 'manual'
        )
        
        console.log('Assinaturas manuais filtradas:', manualSubs.length)
        
        if (manualSubs.length > 0) {
          // Mapear para o formato do componente
          const formattedSubs = manualSubs.map(sub => {
            // Datas de início e fim no formato timestamp para exibição
            const startDate = sub.startDate || sub.createdAt
            const endDate = sub.endDate || sub.expiresAt
            
            const startTimestamp = startDate ? new Date(startDate).getTime() / 1000 : undefined
            const endTimestamp = endDate ? new Date(endDate).getTime() / 1000 : undefined
            const createdTimestamp = sub.createdAt ? new Date(sub.createdAt).getTime() / 1000 : undefined
            
            return {
              id: sub.id,
              provider: 'manual',
              type: 'manual',
              orderId: sub.orderId || '',
              planName: sub.planName || 'Plano Manual',
              amount: sub.amount || 0,
              price: sub.price || 0,
              currency: 'BRL',
              interval: sub.planInterval || 'month',
              intervalCount: sub.planIntervalCount || 1,
              created: createdTimestamp,
              currentPeriodStart: startTimestamp,
              currentPeriodEnd: endTimestamp,
              status: sub.status || 'active',
              paymentMethod: sub.paymentMethod || 'manual',
              partnerId: sub.partnerId,
              userEmail: sub.userEmail,
              userId: sub.userId || sub.memberId,
              createdAt: sub.createdAt,
              updatedAt: sub.updatedAt,
              expiresAt: sub.expiresAt
            } as ManualSubscription
          })
          
          setSubscriptions(formattedSubs)
          
          // Criar transações a partir das assinaturas
          const simulatedTransactions = formattedSubs.map(sub => {
            return {
              id: `tx_${sub.id}`,
              amount: sub.price || 0,
              created: sub.created,
              status: 'succeeded',
              description: `Pagamento ${sub.planName} - Manual`,
              provider: 'manual',
              planName: sub.planName,
              orderId: sub.orderId
            } as ManualTransaction
          })
          
          setTransactions(simulatedTransactions)
        } else {
          // Se não encontrou assinaturas manuais, criar uma de demonstração
          createDummySubscription()
        }
      } catch (error) {
        console.error('Erro ao buscar assinaturas manuais:', error)
        createDummySubscription()
      }
    } catch (error) {
      console.error('Erro ao buscar dados da assinatura:', error)
      setError('Erro ao carregar dados da assinatura')
      createDummySubscription()
    } finally {
      setLoading(false)
    }
  }
  
  const createDummySubscription = () => {
    console.log('Criando assinatura manual de demonstração')
    const now = new Date()
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 1)
    
    const sub: ManualSubscription = {
      id: 'manual-demo',
      provider: 'manual',
      type: 'manual',
      planName: 'Plano Manual',
      amount: 0,
      price: 0,
      currency: 'BRL',
      interval: 'month',
      intervalCount: 1,
      created: now.getTime() / 1000,
      currentPeriodStart: now.getTime() / 1000,
      currentPeriodEnd: futureDate.getTime() / 1000,
      status: 'active',
      paymentMethod: 'Cartão de Crédito',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: futureDate.toISOString()
    }
    
    const tx: ManualTransaction = {
      id: 'tx-manual-demo',
      amount: 0,
      created: now.getTime() / 1000,
      status: 'succeeded',
      description: 'Pagamento Plano Manual - Demonstração',
      provider: 'manual'
    }
    
    setSubscriptions([sub])
    setTransactions([tx])
  }

  useEffect(() => {
    if (userId) {
      fetchSubscriptionData()
    }
  }, [userId])

  // Funções auxiliares
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '-'
    try {
      return format(new Date(timestamp * 1000), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      console.error("Erro ao formatar data:", error, timestamp)
      return '-'
    }
  }

  const getFormattedStatus = (subscription: ManualSubscription | null): StatusInfo => {
    if (!subscription) return statusMap.unknown
    const status = subscription.status || 'unknown'
    const statusKey = Object.keys(statusMap).includes(status) ? status as StatusKey : 'unknown'
    return statusMap[statusKey]
  }

  const getInterval = (subscription: ManualSubscription | null): string => {
    if (!subscription) return intervalMap.month
    const interval = subscription.interval || 'month'
    const intervalKey = Object.keys(intervalMap).includes(interval) ? interval as IntervalKey : 'month'
    return intervalMap[intervalKey]
  }

  // Formatar valor para exibição
  const formatAmount = (amount: number): string => {
    try {
      return formatCurrency(amount)
    } catch (error) {
      console.error("Erro ao formatar valor:", error, amount)
      return `R$ ${amount?.toFixed(2) || '0,00'}`
    }
  }

  // Pegar a assinatura ativa (se houver)
  const activeSubscription = subscriptions.find(sub => 
    sub.status === 'active' || sub.status === 'ativa' || sub.status === 'iniciada'
  )
  const hasOnlyCanceledSubscriptions = subscriptions.length > 0 && !activeSubscription

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
        <CardTitle className="text-zinc-500 text-lg">Minha Assinatura Manual</CardTitle>
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
                    <h3 className="text-md font-semibold text-zinc-500">
                      Assinatura Ativa
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-purple-200 bg-purple-500/10 text-purple-500">
                        Manual
                      </Badge>
                      <Badge className={getFormattedStatus(activeSubscription).color}>
                        {getFormattedStatus(activeSubscription).label}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4 text-[#b5b6c9]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-xs text-zinc-400 mb-1">Plano</h4>
                        <p className="text-zinc-600 text-sm">{activeSubscription.planName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-xs text-zinc-400 mb-1">Valor</h4>
                        <p className="text-zinc-600 text-sm">
                          {formatAmount(activeSubscription.price || 0)}
                          /{getInterval(activeSubscription)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-xs text-zinc-400 mb-1">Período Atual</h4>
                        <p className="text-zinc-600 text-sm">
                          {formatDate(activeSubscription.currentPeriodStart)} - 
                          {formatDate(activeSubscription.currentPeriodEnd)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-xs text-zinc-400 mb-1">Data de Adesão</h4>
                        <p className="text-zinc-600 text-sm">
                          {formatDate(activeSubscription.created)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-sm text-zinc-400 mb-1">Forma de Pagamento</h4>
                      <div className="flex flex-col items-left gap-2 bg-purple-100 p-3 rounded-xl justify-between md:w-[55%] sm:max-w-[100%]">
                        <p className="text-zinc-600">
                          <span className="bg-white px-2 rounded-md font-medium text-purple-500">
                            {activeSubscription.paymentMethod || 'Manual'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-sm text-zinc-400 mb-1">Provedor de Pagamento</h4>
                      <div className="flex flex-col items-left gap-2 bg-purple-100 p-3 rounded-xl justify-between md:w-[55%] sm:max-w-[100%]">
                        <p className="text-zinc-600">
                          <span className="bg-white px-2 rounded-md font-medium text-purple-500">Administrativo</span>
                          {activeSubscription.orderId && (
                            <span className="font-medium ml-2 text-sm"> {activeSubscription.orderId}</span>
                          )}
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
                          {formatAmount(subscription.price || 0)}
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
            {transactions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-sm text-zinc-400/70 mb-4">
                  Histórico de Transações
                </h3>
                <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-zinc-300 text-xs w-[20%]">Data</TableHead>
                        <TableHead className="text-zinc-300 text-xs w-[50%]">Descrição</TableHead>
                        <TableHead className="text-zinc-300 text-xs w-[20%]">Valor</TableHead>
                        <TableHead className="text-zinc-300 text-xs w-[20%]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} className="bg-white">
                          <TableCell className="text-zinc-600 font-medium text-xs">
                            {formatDate(transaction.created)}
                          </TableCell>
                          <TableCell className="text-zinc-600 text-xs">
                            {transaction.description || `Assinatura ${transaction.planName || 'Manual'}`}
                          </TableCell>
                          <TableCell className="text-zinc-600 font-medium">
                            {formatAmount(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-zinc-600 text-xs">
                            <Badge 
                              className={
                                transaction.status === 'succeeded' || transaction.status === 'active' 
                                ? 'bg-green-500 text-sm' 
                                : 'bg-yellow-500 text-sm'
                              }
                            >
                              {transaction.status === 'succeeded' ? 'Concluído' : 'Pendente'}
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
    </>
  )
} 