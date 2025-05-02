import { UnifiedLoginForm } from "@/components/auth/unified-login-form"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  
  // Preencher o email se vier como parâmetro da URL
  useEffect(() => {
    const emailParam = searchParams?.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  return (
    <UnifiedLoginForm
      title="Login"
      subtitle="Entre com sua conta para continuar"
      registerUrl="/register"
      initialEmail={email}
    />
  )
} 