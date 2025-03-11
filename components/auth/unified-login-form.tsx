"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { Loader2, ArrowRight } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import Link from "next/link"
import { toast } from "sonner"

interface UnifiedLoginFormProps {
  title: string
  subtitle: string
  registerUrl: string
}

export function UnifiedLoginForm({ title, subtitle, registerUrl }: UnifiedLoginFormProps) {
  const { signIn, signInWithGoogle, signInWithFacebook, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError("Preencha todos os campos")
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // A nova versão do signIn detecta automaticamente o tipo de usuário
      await signIn(email, password)
      toast.success("Login efetuado com sucesso!")
      // O redirecionamento será feito pelo próprio authContext baseado no tipo de usuário
    } catch (error: any) {
      console.error("Erro no login:", error)
      setError(error.message || "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // A nova versão do signInWithGoogle detecta automaticamente o tipo de usuário
      await signInWithGoogle()
      toast.success("Login com Google efetuado com sucesso!")
      // O redirecionamento será feito pelo próprio authContext
    } catch (error: any) {
      console.error("Erro no login com Google:", error)
      setError(error.message || "Erro ao fazer login com Google")
    } finally {
      setLoading(false)
    }
  }

  const handleFacebookSignIn = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // A nova versão do signInWithFacebook detecta automaticamente o tipo de usuário
      await signInWithFacebook()
      toast.success("Login com Facebook efetuado com sucesso!")
      // O redirecionamento será feito pelo próprio authContext
    } catch (error: any) {
      console.error("Erro no login com Facebook:", error)
      setError(error.message || "Erro ao fazer login com Facebook")
    } finally {
      setLoading(false)
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
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-zinc-200"
                required
              />
            </div>
            
            {error && (
              <div className="p-3 text-sm bg-red-500/10 border border-red-500/30 rounded text-red-500">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-dark text-white"
              disabled={loading || authLoading}
            >
              {loading || authLoading ? (
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
              disabled={loading || authLoading}
              className="bg-white border-zinc-200 hover:bg-white hover:text-zinc-500"
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              Google
            </Button>
            {/* <Button
              variant="outline"
              onClick={handleFacebookSignIn}
              disabled={loading || authLoading}
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