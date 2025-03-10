"use client"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Logo } from "@/components/ui/logo"

// Componente com a lógica principal
function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Digite seu email")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar email de recuperação")
      }

      toast.success("Email de recuperação enviado com sucesso!")
      router.push("/auth/master") // Redireciona para a página de login

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-6">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-[400px] bg-zinc-100 text-zinc-500 border-zinc-200">
        <CardHeader>
          <CardTitle>Recuperar Senha</CardTitle>
          <CardDescription className="text-zinc-400">
            Digite seu email para receber as instruções de recuperação de senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-100 border-zinc-200"
                disabled={isLoading}
                placeholder="Digite seu email"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/80"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Email"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full hover:bg-zinc-100"
              onClick={() => router.push("/auth/master")}
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
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}
