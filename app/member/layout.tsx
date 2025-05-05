"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { Home, User, Ticket, MessageSquareText } from "lucide-react"

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

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
      href: "https://chat.whatsapp.com/J1Y6dRhjik96YQOsOH0rjr",
      icon: <MessageSquareText className="h-5 w-5" />,
      label: "Comunidade"
    }
  ]
  return (
    <RouteGuard allowedUserType="member">
      <SubscriptionProvider>
        <EstablishmentProvider>
          <div className="min-h-screen bg-zinc-100 pb-14">
            <Header menuItems={menuItems} />
            <main className="py-2">
              {children}
            </main>
          </div>
        </EstablishmentProvider>
      </SubscriptionProvider>
    </RouteGuard>
  )
}
