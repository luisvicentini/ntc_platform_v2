"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { Home, User, Ticket } from "lucide-react"

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const menuItems = [
    {
      href: "/member/feed",
      icon: <Home className="h-4 w-4" />,
      label: "Feed"
    },
    {
      href: "/member/coupons",
      icon: <Ticket className="h-4 w-4" />,
      label: "Meus Cupons"
    },
    {
      href: "/member/profile",
      icon: <User className="h-4 w-4" />,
      label: "Perfil"
    }
  ]
  return (
    <RouteGuard allowedUserType="member">
      <SubscriptionProvider>
        <EstablishmentProvider>
          <div className="min-h-screen">
            <Header menuItems={menuItems} />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </EstablishmentProvider>
      </SubscriptionProvider>
    </RouteGuard>
  )
}
