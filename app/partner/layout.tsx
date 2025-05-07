"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { Header } from "@/components/header"

import { useAuth } from "@/contexts/auth-context"
import { FileText, LayoutDashboard, MapPinHouse, TicketCheck, Users } from "lucide-react"
import { WhatsAppSupportButton } from "@/components/whatsapp-support-button"


export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const menuItems = [
    {
      href: "/partner/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard"
    },
    {
      href: "/partner/establishments",
      icon: <MapPinHouse className="h-4 w-4" />,
      label: "Estabelecimentos"
    },
    {
      href: "/partner/members",
      icon: <Users className="h-4 w-4" />,
      label: "Assinantes"
    },
  ]

  return (
    <RouteGuard allowedUserType="partner">
      <EstablishmentProvider>
        <div className="min-h-screen">
          <Header menuItems={menuItems} />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            
            {/* Botão flutuante de suporte via WhatsApp */}
            <WhatsAppSupportButton 
              phoneNumber="5519982240767" 
              message="Olá! Preciso de ajuda na plataforma do Clube Não Tem Chef." 
            />
        </div>
      </EstablishmentProvider>
    </RouteGuard>
  )
}
