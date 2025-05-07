"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { Home, User, Ticket, MessageSquareText } from "lucide-react"
import { CommunityDrawerProvider, useCommunityDrawer } from "@/components/community-tutorial-drawer"
import { WhatsAppSupportButton } from "@/components/whatsapp-support-button"

export default function MemberLayout({ children }: { children: React.ReactNode }) {

  return (
    <RouteGuard allowedUserType="member">
      <SubscriptionProvider>
        <EstablishmentProvider>
          <CommunityDrawerProvider>
            <MemberLayoutContent>{children}</MemberLayoutContent>
          </CommunityDrawerProvider>
        </EstablishmentProvider>
      </SubscriptionProvider>
    </RouteGuard>
  )
}

function MemberLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { openDrawer } = useCommunityDrawer();
  
  const menuItems = [
    {
      href: "/member/feed",
      icon: <Home className="h-5 w-5" />,
      label: "Feed"
    },
    {
      href: "/member/coupons",
      icon: <Ticket className="h-5 w-5" />,
      label: "Meus Cupons"
    },
    {
      href: "/member/profile",
      icon: <User className="h-5 w-5" />,
      label: "Perfil"
    },
    {
      href: "#",
      icon: <MessageSquareText className="h-5 w-5" />,
      label: "Comunidade",
      onClick: openDrawer
    }
  ]
  
  return (
    <div className="min-h-screen bg-zinc-100 pb-14">
      <Header menuItems={menuItems} />
      <main className="py-2">
        {children}
      </main>
      
      {/* Botão flutuante de suporte via WhatsApp */}
      <WhatsAppSupportButton 
        phoneNumber="5519982240767" 
        message={`Olá! Sou o usuário *${user?.displayName}* no Clube Não Tem Chef e preciso de ajuda com a plataforma. Meu email é *${user?.email}*`} 
      />
    </div>
  )
}
