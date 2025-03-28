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

        // Verificar primeiro a assinatura Lastlink
        const lastlinkResponse = await fetch(`/api/user/subscription/lastlink?userId=${user.uid}`)
        if (lastlinkResponse.ok) {
          const lastlinkData = await lastlinkResponse.json()
          if (lastlinkData.subscriptions?.some((sub: any) => 
            sub.status === 'active' || sub.status === 'ativa' || sub.status === 'iniciada'
          )) {
            setSubscriptionType('lastlink')
            setLoading(false)
            return
          }
        }

        // Se não encontrou Lastlink ativa, verificar Stripe
        const stripeResponse = await fetch(`/api/user/subscription?userId=${user.uid}`)
        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json()
          if (stripeData.subscriptions?.some((sub: any) => sub.status === 'active')) {
            setSubscriptionType('stripe')
            setLoading(false)
            return
          }
        }

        // Se não encontrou nenhuma assinatura ativa, usar Stripe como padrão
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
  }, [user?.uid])

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
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="subscription">Gestão de Assinatura</TabsTrigger>
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
