"use client"

import { RouteGuard } from "@/components/auth/route-guard"

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedUserType="partner">
      <div className="min-h-screen">
        {children}
      </div>
    </RouteGuard>
  )
}
