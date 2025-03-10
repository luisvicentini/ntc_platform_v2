"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo } from "@/components/ui/logo"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserType } from "@/contexts/auth-context"
import { toast } from "sonner"

interface LoginFormProps {
  title: string
  subtitle: string
  showSocialLogin?: boolean
  registerUrl?: string
  userType: UserType
}

export function LoginForm({ 
  title, 
  subtitle, 
  showSocialLogin = true, 
  registerUrl = "/register",
  userType 
}: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      // Verificar apenas se a conta está ativa, sem verificar o tipo
      const userStatusResponse = await fetch(`/api/users/status?email=${encodeURIComponent(email)}`)
      const userStatus = await userStatusResponse.json()

      if (userStatus.error) {
        throw new Error(userStatus.error)
      }

      if (userStatus.status === "inactive") {
        toast.error("Conta não ativada. Verifique seu email para ativar sua conta.", {
          action: {
            label: "Reenviar email",
            onClick: async () => {
              try {
                await fetch("/api/users/resend-activation", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ email }),
                })
                toast.success("Email de ativação reenviado!")
              } catch (error) {
                toast.error("Erro ao reenviar email de ativação")
              }
            },
          },
        })
        setLoading(false)
        return
      }

      // Continuar com o login normal se a conta estiver ativa
      // Não passamos mais o userType para a função signIn
      await signIn(email, password)
      console.log('Login bem sucedido')
      
      // Aguarda um momento para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar o tipo de usuário e redirecionar adequadamente
      const storedUserData = localStorage.getItem('authUser')
      if (!storedUserData) {
        throw new Error('Erro ao recuperar dados do usuário')
      }
      
      const authUser = JSON.parse(storedUserData)
      if (!authUser.userType) {
        throw new Error('Tipo de usuário não definido')
      }

      // Redirecionar baseado no tipo de usuário retornado
      const redirectPath = authUser.userType === "member" 
        ? "/member/feed" 
        : `/${authUser.userType}/dashboard`

      console.log('Redirecionando para:', redirectPath)
      window.location.href = redirectPath
    } catch (error: any) {
      console.error("Erro no login:", error)
      setError(error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      console.log('Iniciando login com Google...')
      await signInWithGoogle(userType)
      console.log('Login com Google bem sucedido')
      
      // Aguarda um momento para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar se o usuário tem o userType correto
      const storedUserData = localStorage.getItem('authUser')
      if (!storedUserData) {
        throw new Error('Erro ao salvar dados do usuário')
      }
      
      const userData = JSON.parse(storedUserData) as { userType: UserType }
      if (userData.userType !== userType) {
        throw new Error(`Você não tem permissão para fazer login`)
      }

      const redirectPath = userType === "member" ? "/member/feed" : `/${userType}/dashboard`
      console.log('Redirecionando para:', redirectPath)
      window.location.href = redirectPath
    } catch (error) {
      console.error("Google login error:", error)
      setError("Erro ao fazer login com Google.")
    } finally {
      setLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      console.log('Iniciando login com Facebook...')
      await signInWithFacebook(userType)
      console.log('Login com Facebook bem sucedido')
      
      // Aguarda um momento para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar se o usuário tem o userType correto
      const storedUserData = localStorage.getItem('authUser')
      if (!storedUserData) {
        throw new Error('Erro ao salvar dados do usuário')
      }
      
      const userData = JSON.parse(storedUserData) as { userType: UserType }
      if (userData.userType !== userType) {
        throw new Error(`Você não tem permissão para fazer login`)
      }

      const redirectPath = userType === "member" ? "/member/feed" : `/${userType}/dashboard`
      console.log('Redirecionando para:', redirectPath)
      window.location.href = redirectPath
    } catch (error) {
      console.error("Facebook login error:", error)
      setError("Erro ao fazer login com Facebook.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="mb-8">
          <Logo />
        </div>
      </div>
      <div className="flex flex-col space-y-2 text-center">
        
        <h1 className="text-2xl font-semibold tracking-tight text-custom-primary">{title}</h1>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-6">
        {showSocialLogin && (
          <>
            <div className="grid grid-cols-2 gap-6">
              <Button 
                variant="outline" 
                type="button" 
                className="bg-white text-black border-zinc-500"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <FcGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button 
                variant="outline" 
                type="button" 
                className="bg-white text-black border-zinc-500"
                onClick={handleFacebookLogin}
                disabled={loading}
              >
                <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                Facebook
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-500/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500">Ou continue com</span>
              </div>
            </div>
          </>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-zinc-500">
            Email
          </Label>
          <Input
            id="email"
            placeholder="nome@exemplo.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            className="border-zinc-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-zinc-500">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="password"
              placeholder="********"
              type={showPassword ? "text" : "password"}
              autoCapitalize="none"
              autoComplete="current-password"
              className="border-zinc-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-zinc-500 hover:text-custom-primary"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" disabled={loading} />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-500"
            >
              Manter conectado
            </label>
          </div>
          <a href="/auth/forgot-password" className="text-sm font-medium text-custom-primary hover:text-custom-primary-dark">
            Esqueceu a senha?
          </a>
        </div>
        <Button 
          type="submit" 
          className="w-full bg-custom-primary hover:bg-custom-primary-dark"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar no sistema"}
        </Button>
      </form>
      {userType === "member" && (
        <div className="text-center text-sm text-zinc-500">
          Não tem uma conta?{" "}
          <a href="/auth/register" className="text-custom-primary hover:text-custom-primary-dark underline underline-offset-4">
            Criar conta
          </a>
        </div>
      )}
    </div>
  )
}
