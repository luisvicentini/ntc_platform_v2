"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Loader2, Eye, EyeOff } from "lucide-react"

// Componente para buscar e usar os parâmetros de consulta
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false,
    lowercase: false,
  })
  const [passwordsMatch, setPasswordsMatch] = useState(true)

  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
    })
  }, [password])

  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword)
    }
  }, [password, confirmPassword])

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error("Token de recuperação inválido")
      return
    }

    if (!isPasswordValid) {
      toast.error("A senha não atende aos requisitos mínimos")
      return
    }

    if (!passwordsMatch) {
      toast.error("As senhas não coincidem")
      return
    }

    setIsLoading(true)
    console.log("Iniciando processo de redefinição de senha")

    try {
      console.log("Enviando requisição para resetar senha com token:", token.substring(0, 10) + "...")
      
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      console.log("Resposta recebida, status:", response.status)
      const data = await response.json()
      console.log("Corpo da resposta:", data)

      if (!response.ok) {
        console.error("Erro na resposta:", data)
        
        // Mensagens mais amigáveis para erros comuns
        if (data.error?.includes("UID inválido")) {
          throw new Error("Link de redefinição inválido. Por favor, solicite um novo link.")
        }
        
        if (data.error?.includes("Token expirado") || data.error?.includes("Token inválido")) {
          throw new Error("Este link de redefinição expirou ou é inválido. Por favor, solicite um novo link.")
        }
        
        if (data.error?.includes("não conseguimos localizar o usuário") || 
            data.error?.includes("Usuário não encontrado")) {
          throw new Error("Não conseguimos localizar sua conta. Por favor, verifique se o email informado está correto ou entre em contato com o suporte.")
        }
        
        if (data.error?.includes("email já existe") || 
            data.error?.includes("Email já existe")) {
          throw new Error("Ocorreu um problema técnico com sua conta. Por favor, entre em contato com o suporte informando o seu email.")
        }
        
        if (data.error?.includes("Erro interno")) {
          throw new Error("Ocorreu um erro interno. Nossa equipe técnica já foi notificada. Por favor, tente novamente mais tarde ou entre em contato com o suporte.")
        }
        
        throw new Error(data.error || "Erro ao redefinir senha")
      }

      console.log("Senha redefinida com sucesso")
      toast.success("Senha redefinida com sucesso!")
      router.push("/login") // Redireciona para a página de login

    } catch (error: any) {
      console.error("Erro durante a redefinição de senha:", error)
      toast.error(error.message || "Erro ao redefinir senha")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-6">
        <div className="mb-8">
          <Image
            src="/logo.svg"
            alt="NTC Logo"
            width={120}
            height={120}
            className="dark:invert"
          />
        </div>
        <Card className="w-[400px] bg-zinc-100 text-zinc-500 border-zinc-200">
          <CardHeader>
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription className="text-zinc-400">
              O link de recuperação é inválido ou expirou.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-6">
      <div className="mb-8">
        <Image
          src="/logo.svg"
          alt="NTC Logo"
          width={120}
          height={120}
          className="dark:invert"
        />
      </div>
      <Card className="w-[400px] bg-zinc-100 text-zinc-500 border-zinc-200">
        <CardHeader>
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription className="text-zinc-400">
            Digite sua nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Requisitos da senha:</Label>
                <ul className="text-sm space-y-1">
                  <li className={passwordValidation.length ? "text-green-500" : "text-zinc-400"}>
                    • Mínimo de 8 caracteres
                  </li>
                  <li className={passwordValidation.number ? "text-green-500" : "text-zinc-400"}>
                    • Pelo menos um número
                  </li>
                  <li className={passwordValidation.special ? "text-green-500" : "text-zinc-400"}>
                    • Pelo menos um caractere especial
                  </li>
                  <li className={passwordValidation.uppercase ? "text-green-500" : "text-zinc-400"}>
                    • Pelo menos uma letra maiúscula
                  </li>
                  <li className={passwordValidation.lowercase ? "text-green-500" : "text-zinc-400"}>
                    • Pelo menos uma letra minúscula
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`bg-white border-zinc-200 ${!password || isPasswordValid ? "" : "border-red-500"}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-zinc-400 hover:text-zinc-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirme a Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`bg-white border-zinc-200 ${!confirmPassword || passwordsMatch ? "" : "border-red-500"}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-zinc-400 hover:text-zinc-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-red-500">As senhas não coincidem</p>
                )}
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/80"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principal que envolve o componente com useSearchParams em um Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
