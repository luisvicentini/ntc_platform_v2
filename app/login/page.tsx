"use client"

import { UnifiedLoginForm } from "@/components/auth/unified-login-form"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  // Apenas capturar o parâmetro de email da URL
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ""
  
  return (
    <UnifiedLoginForm
      title="Login"
      subtitle="Entre com sua conta para continuar"
      registerUrl="/register"
      initialEmail={email}
    />
  )
} 