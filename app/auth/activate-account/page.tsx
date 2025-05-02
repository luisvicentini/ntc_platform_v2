"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff, Shield, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

// Componente para validação de força da senha
function PasswordStrengthMeter({ password }: { password: string }) {
  const getPasswordStrength = (password: string) => {
    let score = 0
    
    // Comprimento mínimo
    if (password.length >= 8) score += 25
    
    // Verificar caracteres especiais
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 25
    
    // Verificar números
    if (/\d/.test(password)) score += 25
    
    // Verificar letras maiúsculas e minúsculas
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 25
    
    return score
  }
  
  const strength = getPasswordStrength(password)
  
  const getStrengthLabel = () => {
    if (strength === 0) return "Sem senha"
    if (strength <= 25) return "Fraca"
    if (strength <= 50) return "Média"
    if (strength <= 75) return "Boa"
    return "Forte"
  }
  
  const getStrengthColor = () => {
    if (strength === 0) return "text-zinc-200"
    if (strength <= 25) return "text-red-500"
    if (strength <= 50) return "text-orange-500"
    if (strength <= 75) return "text-yellow-500"
    return "text-green-500"
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Shield className="h-4 w-4 mr-2 text-zinc-500" />
          <span className="text-sm text-zinc-500">Força da senha</span>
        </div>
        <span className={`text-sm font-medium ${getStrengthColor()}`}>{getStrengthLabel()}</span>
      </div>
      
      {password && (
        <div className="text-xs space-y-1 mt-2">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${password.length >= 8 ? 'bg-green-500' : 'bg-zinc-300'}`}></div>
            <span className={password.length >= 8 ? 'text-green-700' : 'text-zinc-500'}>
              Mínimo de 8 caracteres
            </span>
          </div>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-500' : 'bg-zinc-300'}`}></div>
            <span className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-700' : 'text-zinc-500'}>
              Pelo menos um caractere especial
            </span>
          </div>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${/\d/.test(password) ? 'bg-green-500' : 'bg-zinc-300'}`}></div>
            <span className={/\d/.test(password) ? 'text-green-700' : 'text-zinc-500'}>
              Pelo menos um número
            </span>
          </div>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'bg-green-500' : 'bg-zinc-300'}`}></div>
            <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-700' : 'text-zinc-500'}>
              Letras maiúsculas e minúsculas
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente principal com a lógica de ativação
function ActivateAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'pending'>('pending')
  const [verificationMessage, setVerificationMessage] = useState("")
  const [userData, setUserData] = useState<{
    email?: string;
    name?: string;
    userId?: string;
  } | null>(null)
  
  // Verificar o token quando a página carregar
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerificationStatus('error')
        setVerificationMessage("Token de ativação não fornecido")
        setVerifying(false)
        return
      }
      
      try {
        const response = await fetch(`/api/account-activation/verify?token=${token}`)
        const data = await response.json()
        
        if (response.ok && data.valid) {
          setVerificationStatus('success')
          setVerificationMessage("Token válido! Defina sua nova senha abaixo.")
          setUserData(data.user || {})
        } else {
          setVerificationStatus('error')
          setVerificationMessage(data.message || "Token inválido ou expirado")
        }
      } catch (error) {
        console.error("Erro ao verificar token:", error)
        setVerificationStatus('error')
        setVerificationMessage("Não foi possível verificar o token")
      } finally {
        setVerifying(false)
      }
    }
    
    verifyToken()
  }, [token])
  
  // Calcular a força da senha
  const isPasswordStrong = () => {
    // Mínimo 8 caracteres
    const hasMinLength = password.length >= 8
    // Tem pelo menos um caractere especial
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    // Tem pelo menos um número
    const hasNumber = /\d/.test(password)
    // Tem letras maiúsculas e minúsculas
    const hasMixedCase = /[A-Z]/.test(password) && /[a-z]/.test(password)
    
    return hasMinLength && hasSpecial && hasNumber && hasMixedCase
  }
  
  // Validar formulário antes de enviar
  const isFormValid = () => {
    if (!password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos")
      return false
    }
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem")
      return false
    }
    
    if (!isPasswordStrong()) {
      toast.error("Sua senha não é forte o suficiente")
      return false
    }
    
    return true
  }
  
  // Enviar nova senha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) return
    
    setLoading(true)
    
    try {
      const response = await fetch("/api/account-activation/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("Senha definida com sucesso!")
        
        // Redirecionar para a página de login com o email pré-preenchido
        if (userData?.email) {
          router.push(`/login?email=${encodeURIComponent(userData.email)}&activation=success`)
        } else {
          router.push("/login?activation=success")
        }
      } else {
        toast.error(data.message || "Não foi possível definir a senha")
      }
    } catch (error) {
      console.error("Erro ao definir senha:", error)
      toast.error("Ocorreu um erro ao tentar definir sua senha")
    } finally {
      setLoading(false)
    }
  }
  
  // Renderizar diferentes estados da página
  if (verifying) {
    return (
      <div className="flex items-center justify-center p-4 w-full h-full">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-700">Verificando token de ativação...</h2>
          <p className="text-zinc-500 mt-2">Aguarde um momento, estamos validando suas informações.</p>
        </div>
      </div>
    )
  }
  
  if (verificationStatus === 'error') {
    return (
      <div className="flex items-center justify-center p-4 w-full h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-red-700">Não foi possível ativar a conta</CardTitle>
            <CardDescription className="text-zinc-600">{verificationMessage}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/login">Ir para o login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center rounded-xl shadow-lg w-full max-w-md">
      <Card className="w-full border-none">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <Image 
                src="/logo.svg" 
                alt="Logo" 
                fill 
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Ative sua conta</CardTitle>
          <CardDescription className="text-center">
            {userData?.name ? `Olá ${userData.name}!` : 'Olá!'} Defina uma senha para ativar sua conta.
          </CardDescription>
          
          {verificationStatus === 'success' && (
            <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Token verificado</AlertTitle>
              <AlertDescription>
                Seu token de ativação é válido. Defina sua senha para continuar.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <PasswordStrengthMeter password={password} />
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Confirme sua nova senha"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-500 mt-1">As senhas não coincidem</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Definir senha e ativar conta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center w-full">
            <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-700">
              Voltar para o login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

// Componente principal da página com Suspense
export default function ActivateAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-700">Carregando...</h2>
        </div>
      </div>
    }>
      <ActivateAccountContent />
    </Suspense>
  )
} 
