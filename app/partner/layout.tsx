"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { Header } from "@/components/header"

import { useAuth } from "@/contexts/auth-context"
import { FileText, LayoutDashboard, MapPinHouse, TicketCheck } from "lucide-react"


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
      href: "/partner/reports",
      icon: <FileText className="h-4 w-4" />,
      label: "Relatórios"
    }
  ]

  return (
    <RouteGuard allowedUserType="partner">
      <EstablishmentProvider>
        <div className="min-h-screen">
          <Header menuItems={menuItems} />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
        </div>
      </EstablishmentProvider>
    </RouteGuard>
  )
}
