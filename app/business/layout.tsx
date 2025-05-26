"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { Header } from "@/components/header"

import { useAuth } from "@/contexts/auth-context"
import { FileText, LayoutDashboard, TicketCheck } from "lucide-react"
import { WhatsAppSupportButton } from "@/components/whatsapp-support-button"


export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const menuItems = [
    {
      href: "/business/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard"
    },
    {
      href: "/business/validate-voucher",
      icon: <TicketCheck className="h-4 w-4" />,
      label: "Validar Voucher"
    },
    {
      href: "/business/reports",
      icon: <FileText className="h-4 w-4" />,
      label: "Relatórios"
    }
  ]

  return (
    <RouteGuard allowedUserType="business">
      <EstablishmentProvider>
        <div className="min-h-screen">
          <Header menuItems={menuItems} />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            
            {/* Botão flutuante de suporte via WhatsApp */}
            <WhatsAppSupportButton 
              phoneNumber="5519996148651" 
              message={`Olá! Sou do estabelecimento *${user?.displayName}* no Clube Não Tem Chef e preciso de ajuda com a plataforma.`} 
            />
        </div>
      </EstablishmentProvider>
    </RouteGuard>
  )
}
