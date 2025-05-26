"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { Loader2, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import Link from "next/link"
import { toast } from "sonner"

interface UnifiedLoginFormProps {
  title: string
  subtitle: string
  registerUrl: string
  initialEmail?: string
  initialPassword?: string
}

// Mapear os códigos de erro do Firebase para mensagens mais amigáveis
const mapFirebaseErrorToMessage = (errorCode: string): string => {
  const errorMap: Record<string, string> = {
    // Erros de autenticação
    "auth/invalid-credential": "Email ou senha incorretos. Verifique suas credenciais e tente novamente.",
    "auth/user-disabled": "Esta conta foi desativada. Entre em contato com o suporte.",
    "auth/user-not-found": "Não encontramos uma conta com este email. Verifique o email ou crie uma nova conta.",
    "auth/wrong-password": "Senha incorreta. Tente novamente ou recupere sua senha.",
    "auth/invalid-email": "O formato do email é inválido. Verifique se digitou corretamente.",
    "auth/too-many-requests": "Muitas tentativas de login. Aguarde um momento e tente novamente.",
    "auth/email-already-in-use": "Este email já está sendo usado por outra conta.",
    "auth/network-request-failed": "Falha na conexão. Verifique sua internet e tente novamente.",
    "auth/popup-closed-by-user": "O login foi cancelado. Tente novamente.",
    "auth/unauthorized-domain": "Este domínio não está autorizado para operações de login.",
    "auth/operation-not-allowed": "Esta operação não está habilitada. Entre em contato com o suporte.",
    "auth/account-exists-with-different-credential": "Já existe uma conta com este email. Tente outro método de login.",
    
    // Erros específicos do sistema
    "account-not-activated": "Sua conta ainda não foi ativada. Verifique seu email para ativar sua conta.",
    "account-expired": "Sua assinatura expirou. Renove para continuar usando o sistema."
  }
  
  return errorMap[errorCode] || "Ocorreu um erro ao fazer login. Entre em contato com o suporte."
}

// Função para extrair o código de erro do objeto de erro do Firebase
const getFirebaseErrorCode = (error: any): string => {
  const errorMessage = error?.message || ""
  const matches = errorMessage.match(/\(([^)]+)\)/)
  return matches && matches[1] ? matches[1] : ""
}

// Componente para exibir o erro com suporte para links clicáveis
const ErrorMessage = ({ message, showWhatsAppSupport }: { message: string, showWhatsAppSupport?: boolean }) => {
  return (
    <div className="p-3 text-sm bg-red-500/10 border border-red-500/30 rounded text-red-500 flex items-start">
      <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
      <div>
        <div>{message}</div>
        {showWhatsAppSupport && (
          <div className="mt-2">
            <p className="mb-2">Entre em contato com o suporte:</p>
            <a 
              href="https://wa.me/5519996148651?text=Olá,%20preciso%20de%20suporte%20pois%20estou%20com%20problemas%20para%20acessar%20minha%20conta."
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-700 underline flex items-center"
            >
              WhatsApp Suporte: +55 (19) 98224-0767
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export function UnifiedLoginForm({ title, subtitle, registerUrl, initialEmail = "", initialPassword = "" }: UnifiedLoginFormProps) {
  const { signIn, signInWithGoogle, signInWithFacebook, loading: authLoading } = useAuth()
  const router = useRouter()
  
  // Obter parâmetros da URL
  const searchParams = useSearchParams()
  
  // Obter o email da URL 
  const emailFromUrl = searchParams?.get('email') || ""
  
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState(initialEmail || emailFromUrl)
  const [password, setPassword] = useState(initialPassword)
  const [showResendActivation, setShowResendActivation] = useState(false)
  const [showWhatsAppSupport, setShowWhatsAppSupport] = useState(false)

  // Atualizar o email quando o parâmetro da URL mudar
  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl)
    }
  }, [emailFromUrl])

  // Verificar se veio de uma ativação de conta bem-sucedida
  useEffect(() => {
    const activationStatus = searchParams?.get('activation')
    if (activationStatus === 'success') {
      toast.success("Conta ativada com sucesso! Você já pode fazer login.")
    }
  }, [searchParams])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError("Preencha todos os campos")
      return
    }
    
    setIsLoading(true)
    setError(null)
    setShowResendActivation(false)
    setShowWhatsAppSupport(false)
    
    try {
      // A nova versão do signIn detecta automaticamente o tipo de usuário
      await signIn(email, password)
      toast.success("Login efetuado com sucesso!")
      // O redirecionamento será feito pelo próprio authContext baseado no tipo de usuário
    } catch (error: any) {
      console.error("Erro no login:", error)
      
      // Verificar se é um erro do Firebase e obter o código
      const errorCode = getFirebaseErrorCode(error)
      
      // Verificar se a conta não está ativada (verificação adicional no próprio erro)
      if (error.message && (
          error.message.includes("not activated") || 
          error.message.includes("not verified") ||
          error.message.includes("inactive")
      )) {
        setError("Sua conta ainda não foi ativada. Verifique seu email para ativar sua conta.")
        setShowResendActivation(true)
      } else if (error.message && error.message.includes("não encontrado no banco de dados")) {
        setError("Usuário não encontrado no banco de dados.")
        setShowWhatsAppSupport(true)
      } else if (errorCode) {
        // Mapear o código para uma mensagem amigável
        setError(mapFirebaseErrorToMessage(errorCode))
        
        // Se for erro de credenciais, verificar se pode ser falta de ativação
        if (errorCode === "auth/invalid-credential" || errorCode === "auth/user-not-found") {
          // Mostrar opção de reenviar ativação como precaução
          setShowResendActivation(true)
        }
      } else {
        // Erros não mapeados ou sem código específico
        setError(error.message || "Erro ao fazer login. Tente novamente mais tarde.")
        setShowWhatsAppSupport(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    setShowResendActivation(false)
    setShowWhatsAppSupport(false)
    
    try {
      // A nova versão do signInWithGoogle detecta automaticamente o tipo de usuário
      await signInWithGoogle()
      toast.success("Login com Google efetuado com sucesso!")
      // O redirecionamento será feito pelo próprio authContext
    } catch (error: any) {
      console.error("Erro no login com Google:", error)
      
      const errorCode = getFirebaseErrorCode(error)
      
      if (error.message && error.message.includes("não encontrado no banco de dados")) {
        setError("Usuário não encontrado no banco de dados.")
        setShowWhatsAppSupport(true)
      } else if (errorCode) {
        setError(mapFirebaseErrorToMessage(errorCode))
      } else if (error.message && error.message.includes("not activated")) {
        setError("Sua conta ainda não foi ativada. Verifique seu email para ativar sua conta.")
        setShowResendActivation(true)
      } else {
        setError(error.message || "Erro ao fazer login com Google. Tente novamente mais tarde.")
        setShowWhatsAppSupport(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookSignIn = async () => {
    setIsLoading(true)
    setError(null)
    setShowResendActivation(false)
    setShowWhatsAppSupport(false)
    
    try {
      // A nova versão do signInWithFacebook detecta automaticamente o tipo de usuário
      await signInWithFacebook()
      toast.success("Login com Facebook efetuado com sucesso!")
      // O redirecionamento será feito pelo próprio authContext
    } catch (error: any) {
      console.error("Erro no login com Facebook:", error)
      
      const errorCode = getFirebaseErrorCode(error)
      
      if (error.message && error.message.includes("não encontrado no banco de dados")) {
        setError("Usuário não encontrado no banco de dados.")
        setShowWhatsAppSupport(true)
      } else if (errorCode) {
        setError(mapFirebaseErrorToMessage(errorCode))
      } else if (error.message && error.message.includes("not activated")) {
        setError("Sua conta ainda não foi ativada. Verifique seu email para ativar sua conta.")
        setShowResendActivation(true)
      } else {
        setError(error.message || "Erro ao fazer login com Facebook. Tente novamente mais tarde.")
        setShowWhatsAppSupport(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendActivation = async () => {
    if (!email) {
      setError("Digite seu email para reenviar o link de ativação")
      return
    }
    
    setIsLoading(true)
    try {
      // Chamar API para reenviar email de ativação
      const response = await fetch("/api/auth/resend-activation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao reenviar email de ativação")
      }
      
      toast.success("Email de ativação reenviado com sucesso! Verifique sua caixa de entrada.")
      setShowResendActivation(false)
    } catch (error: any) {
      console.error("Erro ao reenviar ativação:", error)
      setError(error.message || "Erro ao reenviar email de ativação. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-zinc-50 container flex flex-col items-center justify-center min-h-screen py-2">
      <div className="mb-8">
        <Logo />
      </div>
      
      <Card className="w-[400px] bg-zinc-100 text-zinc-500 border-zinc-200">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-zinc-400">{subtitle}</CardDescription>
        </CardHeader>
        
        <CardContent className="mt-4">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-white border-zinc-200"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="/auth/forgot-password"
                  className="bg-zinc-100 text-sm text-zinc-500 hover:text-primary"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-zinc-200"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {error && (
              <div>
                <ErrorMessage 
                  message={error} 
                  showWhatsAppSupport={showWhatsAppSupport} 
                />
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-dark text-white"
              disabled={isLoading || authLoading}
            >
              {isLoading || authLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-4 animate-spin" /> Entrando...
                </>
              ) : (
                <>
                  Entrar <ArrowRight className="ml-2 h-6 w-4" />
                </>
              )}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-100 px-2 text-zinc-400">Ou continue com</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading || authLoading}
              className="bg-white border-zinc-200 hover:bg-white hover:text-zinc-500"
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              Google
            </Button>
            {/* <Button
              variant="outline"
              onClick={handleFacebookSignIn}
              disabled={isLoading || authLoading}
              className="bg-transparent border-zinc-200 hover:bg-white hover:text-zinc-500"
            >
              <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
              Facebook
            </Button> */}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <div className="text-sm text-zinc-400">
            Não tem uma conta?{" "}
            <Link href={registerUrl} className="text-zinc-500 hover:text-primary">
              Criar conta
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 