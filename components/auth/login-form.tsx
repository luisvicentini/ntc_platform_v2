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
import { useAuth } from "@/contexts/auth-context"
import { UserType } from "@/contexts/auth-context"

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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      console.log('Iniciando login com email/senha...')
      await signIn(email, password, userType)
      console.log('Login bem sucedido')
      
      // Aguarda um momento para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verifica se o usuário foi salvo corretamente
      const storedUser = localStorage.getItem('authUser')
      if (!storedUser) {
        throw new Error('Erro ao salvar dados do usuário')
      }
      
      const redirectPath = userType === "member" ? "/member/feed" : `/${userType}/dashboard`
      console.log('Redirecionando para:', redirectPath)
      window.location.href = redirectPath
    } catch (error) {
      console.error("Login error:", error)
      setError("Erro ao fazer login. Verifique suas credenciais.")
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
      
      // Verifica se o usuário foi salvo corretamente
      const storedUser = localStorage.getItem('authUser')
      if (!storedUser) {
        throw new Error('Erro ao salvar dados do usuário')
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
      
      // Verifica se o usuário foi salvo corretamente
      const storedUser = localStorage.getItem('authUser')
      if (!storedUser) {
        throw new Error('Erro ao salvar dados do usuário')
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
      <div className="flex flex-col space-y-2 text-center">
        <Logo />
        <h1 className="text-2xl font-semibold tracking-tight text-ntc-purple">{title}</h1>
        <p className="text-sm text-ntc-gray">{subtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-6">
        {showSocialLogin && (
          <>
            <div className="grid grid-cols-2 gap-6">
              <Button 
                variant="outline" 
                type="button" 
                className="bg-white text-black border-ntc-gray-light"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <FcGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button 
                variant="outline" 
                type="button" 
                className="bg-white text-black border-ntc-gray-light"
                onClick={handleFacebookLogin}
                disabled={loading}
              >
                <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                Facebook
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-ntc-gray-light" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-ntc-gray">Ou continue com</span>
              </div>
            </div>
          </>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-ntc-gray">
            Email
          </Label>
          <Input
            id="email"
            placeholder="nome@exemplo.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            className="border-ntc-gray-light"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-ntc-gray">
            Senha
          </Label>
          <Input
            id="password"
            placeholder="********"
            type="password"
            autoCapitalize="none"
            autoComplete="current-password"
            className="border-ntc-gray-light"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
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
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ntc-gray"
            >
              Manter conectado
            </label>
          </div>
          <a href="/forgot-password" className="text-sm font-medium text-ntc-purple hover:text-ntc-purple-dark">
            Esqueceu a senha?
          </a>
        </div>
        <Button 
          type="submit" 
          className="w-full bg-ntc-purple hover:bg-ntc-purple-dark"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar no sistema"}
        </Button>
      </form>
      {userType === "member" && (
        <div className="text-center text-sm text-ntc-gray">
          Não tem uma conta?{" "}
          <a href="/auth/register" className="text-ntc-purple hover:text-ntc-purple-dark underline underline-offset-4">
            Criar conta
          </a>
        </div>
      )}
    </div>
  )
}
