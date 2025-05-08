"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/profile/profile-form"
import { StripeSubscriptionManagement } from "./stripe-subscription"
import { LastlinkSubscriptionManagement } from "./lastlink-subscription"
import { ManualSubscriptionManagement } from "./manual-subscription"
import { Loader } from "@/components/ui/loader"
import { useSubscription } from "@/contexts/subscription-context"

export default function ProfilePage() {
  const { user } = useAuth()
  const { getMemberSubscriptions } = useSubscription()
  const [loading, setLoading] = useState(true)
  const [subscriptionType, setSubscriptionType] = useState<'stripe' | 'lastlink' | 'manual' | null>(null)

  useEffect(() => {
    const checkSubscriptionType = async () => {
      try {
        if (!user?.uid) return

        console.log('Verificando assinaturas para usuário:', user.uid)
        let hasActiveSubscription = false

        // Verificar assinatura Lastlink
        try {
          const lastlinkResponse = await fetch(`/api/user/subscription/lastlink?userId=${user.uid}&email=${encodeURIComponent(user.email || '')}`)
          console.log('Status da resposta Lastlink:', lastlinkResponse.status)
          
          if (lastlinkResponse.ok) {
            const lastlinkData = await lastlinkResponse.json()
            console.log('Dados Lastlink recebidos:', lastlinkData)
            
            // Verificar se há assinaturas e se alguma está ativa
            if (lastlinkData.subscriptions?.length > 0) {
              const hasActiveLastlink = lastlinkData.subscriptions.some((sub: any) => {
                const isActive = sub.status === 'active' || 
                               sub.status === 'ativa' || 
                               sub.status === 'iniciada'
                console.log('Status da assinatura Lastlink:', sub.status, 'Ativa?', isActive)
                return isActive
              })

              if (hasActiveLastlink) {
                console.log('Assinatura Lastlink ativa encontrada')
                setSubscriptionType('lastlink')
                setLoading(false)
                return
              }
            }
          }
        } catch (error) {
          console.error('Erro ao verificar assinatura Lastlink:', error)
        }

        // Se não encontrou Lastlink ativa, verificar Stripe
        try {
          console.log('Verificando assinatura Stripe...')
          const stripeResponse = await fetch(`/api/user/subscription?userId=${user.uid}`)
          console.log('Status da resposta Stripe:', stripeResponse.status)
          
          if (stripeResponse.ok) {
            const stripeData = await stripeResponse.json()
            console.log('Dados Stripe recebidos:', stripeData)
            
            if (stripeData.subscriptions?.some((sub: any) => sub.status === 'active')) {
              console.log('Assinatura Stripe ativa encontrada')
              setSubscriptionType('stripe')
              setLoading(false)
              return
            }
          }
        } catch (error) {
          console.error('Erro ao verificar assinatura Stripe:', error)
        }

        // Se não encontrou nem Lastlink nem Stripe, verificar assinaturas manuais
        try {
          console.log('Verificando assinaturas manuais...')
          const allSubscriptions = await getMemberSubscriptions(user.uid)
          console.log('Todas as assinaturas encontradas:', allSubscriptions.length)
          
          // Verificar se há assinaturas manuais
          const manualSubs = allSubscriptions.filter(sub => {
            // Verificação segura para evitar erros de tipo
            const provider = sub.provider || '';
            const type = sub.type || '';
            // Usando any para contornar o erro do linter
            const paymentMethod = (sub as any).paymentMethod || '';
            
            return provider === 'manual' || 
                  provider === 'admin_panel' || 
                  type === 'manual' || 
                  paymentMethod === 'manual';
          });
          
          console.log('Assinaturas manuais encontradas:', manualSubs.length)
          
          if (manualSubs.length > 0) {
            const hasActiveManual = manualSubs.some(sub => 
              sub.status === 'active' || 
              sub.status === 'ativa' || 
              sub.status === 'iniciada'
            )
            
            if (hasActiveManual) {
              console.log('Assinatura manual ativa encontrada')
              setSubscriptionType('manual')
              setLoading(false)
              return
            }
          }
        } catch (error) {
          console.error('Erro ao verificar assinaturas manuais:', error)
        }

        // Se não encontrou nenhuma assinatura ativa, tentar usar qualquer assinatura manual mesmo que não ativa
        try {
          const allSubscriptions = await getMemberSubscriptions(user.uid)
          const manualSubs = allSubscriptions.filter(sub => {
            const provider = sub.provider || '';
            const type = sub.type || '';
            const paymentMethod = (sub as any).paymentMethod || '';
            
            return provider === 'manual' || 
                  provider === 'admin_panel' || 
                  type === 'manual' || 
                  paymentMethod === 'manual';
          });
          
          if (manualSubs.length > 0) {
            console.log('Usando assinatura manual não-ativa como fallback')
            setSubscriptionType('manual')
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Erro ao tentar fallback para assinatura manual:', error)
        }

        // Se não encontrou nenhuma assinatura, usar Stripe como padrão
        console.log('Nenhuma assinatura encontrada, usando Stripe como padrão')
        setSubscriptionType('stripe')
        setLoading(false)
      } catch (error) {
        console.error('Erro ao verificar tipo de assinatura:', error)
        setSubscriptionType('stripe') // Fallback para Stripe em caso de erro
        setLoading(false)
      }
    }

    if (user?.uid) {
      checkSubscriptionType()
    }
  }, [user?.uid, user?.email, getMemberSubscriptions])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="flex items-center justify-center">
          <Loader className="animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-6">
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-white p-1 rounded-xl border border-zinc-200 gap-1">
          <TabsTrigger className="hover:bg-zinc-100 text-zinc-500 rounded-lg" value="profile">Perfil</TabsTrigger>
          <TabsTrigger className="hover:bg-zinc-100 text-zinc-500 rounded-lg" value="subscription">Gestão de Assinatura</TabsTrigger>
        </TabsList>
        <TabsContent value="subscription">
          {subscriptionType === 'lastlink' ? (
            <LastlinkSubscriptionManagement userId={user.uid} />
          ) : subscriptionType === 'manual' ? (
            <ManualSubscriptionManagement userId={user.uid} />
          ) : (
            <StripeSubscriptionManagement userId={user.uid} />
          )}
        </TabsContent>
        <TabsContent value="profile">
          <ProfileForm user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
