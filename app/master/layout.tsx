"use client"

import { RouteGuard } from "@/components/auth/route-guard"

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedUserType="master">
      <div className="min-h-screen">
        {children}
      </div>
    </RouteGuard>
  )
}
