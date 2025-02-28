"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/contexts/auth-context"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signUp, user } = useAuth()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    try {
      console.log('Iniciando registro...')
      await signUp(email, password, "member")
      console.log('Registro bem sucedido')
      
      // Aguarda um momento para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verifica se o usuário foi salvo corretamente
      const storedUser = localStorage.getItem('authUser')
      if (!storedUser) {
        throw new Error('Erro ao salvar dados do usuário')
      }
      
      // Verifica se veio do checkout e redireciona apropriadamente
      const redirect = searchParams.get('redirect')
      const redirectPath = redirect === 'onboarding' ? '/onboarding' : '/member/feed'
      
      console.log('Redirecionando para:', redirectPath)
      window.location.href = redirectPath
    } catch (error) {
      console.error("Registration error:", error)
      setError("Erro ao criar conta. Verifique suas informações.")
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <Logo />
        <h1 className="text-2xl font-semibold tracking-tight text-ntc-purple">Criar Conta</h1>
        <p className="text-sm text-ntc-gray">
          Crie sua conta de membro para acessar o sistema
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-6">
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
            autoComplete="new-password"
            className="border-ntc-gray-light"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password" className="text-ntc-gray">
            Confirmar Senha
          </Label>
          <Input
            id="confirm-password"
            placeholder="********"
            type="password"
            autoCapitalize="none"
            autoComplete="new-password"
            className="border-ntc-gray-light"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}
        <Button 
          type="submit" 
          className="w-full bg-ntc-purple hover:bg-ntc-purple-dark"
          disabled={loading}
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
      <div className="text-center text-sm text-ntc-gray">
        Já tem uma conta?{" "}
        <a href="/auth/member" className="text-ntc-purple hover:text-ntc-purple-dark underline underline-offset-4">
          Fazer login
        </a>
      </div>
    </div>
  )
}
