"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/ui/logo"

// Componente com a lógica principal
function ActivateAccountForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [userData, setUserData] = useState<any>(null)
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
  
  // Verificar token quando o componente montar
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        toast.error("Token de ativação não encontrado")
        router.push("/login")
        return
      }
      
      try {
        const response = await fetch("/api/verify-activation-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || "Token inválido ou expirado")
        }
        
        setUserData(data.user)
        setIsVerifying(false)
      } catch (error: any) {
        toast.error(error.message || "Erro ao verificar token")
        router.push("/login")
      }
    }
    
    verifyToken()
  }, [token, router])
  
  // Atualizar a validação da senha enquanto o usuário digita
  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
    })
  }, [password])

  // Verificar se as senhas coincidem
  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword)
    }
  }, [password, confirmPassword])

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPasswordValid) {
      toast.error("A senha não atende aos requisitos mínimos")
      return
    }

    if (!passwordsMatch) {
      toast.error("As senhas não coincidem")
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          email: userData?.email
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao definir senha")
      }
      
      toast.success("Senha definida com sucesso!")
      
      // Redirecionar para o login com o email preenchido
      router.push(`/login?email=${encodeURIComponent(userData?.email || "")}`)
    } catch (error: any) {
      toast.error(error.message || "Erro ao definir senha")
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isVerifying) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-6">
        <div className="mb-8">
          <Logo />
        </div>
        <Card className="w-[400px] bg-zinc-100 text-zinc-500 border-zinc-200">
          <CardHeader>
            <CardTitle>Verificando Token</CardTitle>
            <CardDescription className="text-zinc-400">
              Por favor, aguarde enquanto verificamos seu token de ativação
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-6">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-[400px] bg-zinc-100 text-zinc-500 border-zinc-200">
        <CardHeader>
          <CardTitle>Ative sua Conta</CardTitle>
          <CardDescription className="text-zinc-400">
            {userData?.displayName ? `Bem-vindo(a) ${userData.displayName}!` : 'Bem-vindo(a)!'} Por favor, defina sua senha para ativar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData?.email || ""}
                  disabled
                  className="bg-zinc-200 border-zinc-300"
                />
              </div>
              
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
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`bg-white border-zinc-200 pr-10 ${!password || isPasswordValid ? "" : "border-red-500"}`}
                    disabled={isLoading}
                    placeholder="Digite sua senha"
                    required
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
                <Label htmlFor="confirmPassword">Confirme a Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`bg-white border-zinc-200 pr-10 ${!confirmPassword || passwordsMatch ? "" : "border-red-500"}`}
                    disabled={isLoading}
                    placeholder="Confirme sua senha"
                    required
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
                  Ativando...
                </>
              ) : (
                "Ativar Conta"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full hover:bg-zinc-100"
              onClick={() => router.push("/login")}
              disabled={isLoading}
            >
              Voltar para o Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principal com Suspense
export default function ActivateAccountPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    }>
      <ActivateAccountForm />
    </Suspense>
  )
} 