"use client"

import { Suspense } from "react"
import { UnifiedLoginForm } from "@/components/auth/unified-login-form"
import { Loader2 } from "lucide-react"

// Componente do formulário
function LoginForm() {
  return (
    <UnifiedLoginForm
      title="Login"
      subtitle="Entre com sua conta para acessar o sistema"
      registerUrl="/auth/register"
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