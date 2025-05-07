"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { FileText, LayoutDashboard, MapPinHouse, TicketCheck, Users, ShoppingBag } from "lucide-react"
import { WhatsAppSupportButton } from "@/components/whatsapp-support-button"
import { ProductProvider } from "@/contexts/ProductContext"

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
      href: "/partner/products",
      icon: <ShoppingBag className="h-4 w-4" />,
      label: "Produtos"
    },
    {
      href: "/partner/members",
      icon: <Users className="h-4 w-4" />,
      label: "Membros"
    },
    {
      href: "/partner/profile",
      icon: <FileText className="h-4 w-4" />,
      label: "Perfil"
    }
  ]

  return (
    <RouteGuard allowedUserType="partner">
      <EstablishmentProvider>
        <ProductProvider>
          <div className="flex flex-col min-h-screen bg-zinc-50">
            <Header menuItems={menuItems} />
            <main className="flex-1">{children}</main>
            <WhatsAppSupportButton />
          </div>
        </ProductProvider>
      </EstablishmentProvider>
    </RouteGuard>
  )
}
