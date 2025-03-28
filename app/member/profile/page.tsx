"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/profile/profile-form"
import { StripeSubscriptionManagement } from "./stripe-subscription"
import { LastlinkSubscriptionManagement } from "./lastlink-subscription"
import { Loader } from "@/components/ui/loader"

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscriptionType, setSubscriptionType] = useState<'stripe' | 'lastlink' | null>(null)

  useEffect(() => {
    const checkSubscriptionType = async () => {
      try {
        if (!user?.uid) return

        console.log('Verificando assinaturas para usuário:', user.uid)

        // Verificar primeiro a assinatura Lastlink
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

        // Se não encontrou Lastlink ativa, verificar Stripe
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

        // Se não encontrou nenhuma assinatura ativa, usar Stripe como padrão
        console.log('Nenhuma assinatura ativa encontrada, usando Stripe como padrão')
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
  }, [user?.uid, user?.email])

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
      <Tabs defaultValue="subscription" className="space-y-4">
        <TabsList className="bg-white p-1 rounded-xl border border-zinc-200 gap-1">
          <TabsTrigger className="hover:bg-zinc-100 text-zinc-500 rounded-lg" value="profile">Perfil</TabsTrigger>
          <TabsTrigger className="hover:bg-zinc-100 text-zinc-500 rounded-lg" value="subscription">Gestão de Assinatura</TabsTrigger>
        </TabsList>
        <TabsContent value="subscription">
          {subscriptionType === 'lastlink' ? (
            <LastlinkSubscriptionManagement userId={user.uid} />
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
