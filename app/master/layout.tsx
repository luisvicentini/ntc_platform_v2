"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { Handshake, LayoutDashboard, Users } from "lucide-react"
import { WhatsAppSupportButton } from "@/components/whatsapp-support-button"

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const menuItems = [
    {
      href: "/master/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard"
    },
    {
      href: "/master/users",
      icon: <Users className="h-4 w-4" />,
      label: "Usuarios"
    },
    {
      href: "/master/partners",
      icon: <Handshake className="h-4 w-4" />,
      label: "Parceiros"
    }
  ]
  return (
    <RouteGuard allowedUserType="master">
      <EstablishmentProvider>
        <SubscriptionProvider>
          <div className="min-h-screen">
            <Header menuItems={menuItems} />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            
            {/* Botão flutuante de suporte via WhatsApp - para comunicação interna */}
            <WhatsAppSupportButton 
              phoneNumber="5519996148651" 
              message="Olá! Preciso de ajuda interna com o sistema." 
            />
          </div>
        </SubscriptionProvider>
      </EstablishmentProvider>
    </RouteGuard>
  )
}
