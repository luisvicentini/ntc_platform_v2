import { UnifiedLoginForm } from "@/components/auth/unified-login-form"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  
  return (
    <UnifiedLoginForm
      title="Login"
      subtitle="Entre com sua conta para continuar"
      registerUrl="/register"
    />
  )
} 