"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { Header } from "@/components/header"

import { useAuth } from "@/contexts/auth-context"
import { Handshake, LayoutDashboard, Users } from "lucide-react"

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
