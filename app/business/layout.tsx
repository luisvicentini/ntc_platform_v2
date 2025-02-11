"use client"

import { RouteGuard } from "@/components/auth/route-guard"

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedUserType="business">
      <div className="min-h-screen">
        {children}
      </div>
    </RouteGuard>
  )
}
