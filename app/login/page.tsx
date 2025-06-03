"use client"

import { Suspense } from "react"
import { UnifiedLoginForm } from "@/components/auth/unified-login-form"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

// Componente do formulário
function LoginForm() {
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ""
  const password = searchParams?.get('password') || ""
  
  return (
    <UnifiedLoginForm
      title="Login"
      subtitle="Entre com sua conta para acessar o sistema"
      registerUrl="/auth/register"
      initialEmail={email}
      initialPassword={password}
    />
  )
}

// Componente principal com Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}