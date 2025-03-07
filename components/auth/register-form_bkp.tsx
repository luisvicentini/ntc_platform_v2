"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/ui/logo"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card"

export function RegisterForm({ onSuccess, loading: parentLoading }: RegisterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState("")

  // Recuperar dados do checkout do localStorage no início
  const checkoutData = JSON.parse(localStorage.getItem('checkoutData') || '{}')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validar se temos os dados necessários
    if (!checkoutData || !checkoutData.priceId) {
      setError('Dados de checkout não encontrados')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      const userData = {
        email: formData.get("email") as string,
        displayName: formData.get("name") as string,
        phoneNumber: phone,
        city: formData.get("city") as string,
        userType: "member"
      }

      // Registrar usuário - isso vai configurar o cookie __session
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include' // Importante para aceitar cookies
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar usuário')
      }

      console.log('Registro bem sucedido:', data)

      // Criar checkout usando o token da sessão
      const checkoutResponse = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          priceId: checkoutData.priceId,
          userId: data.user.id,
          partnerId: checkoutData.partnerId || null,
          partnerLinkId: checkoutData.partnerLinkId || null
        }),
        credentials: 'include' // Importante para enviar cookies
      })

      const checkoutResult = await checkoutResponse.json()

      if (!checkoutResponse.ok) {
        throw new Error(checkoutResult.error || 'Erro ao criar checkout')
      }

      // Limpar dados do localStorage
      localStorage.removeItem('checkoutData')

      // Redirecionar para URL do Stripe
      window.location.href = checkoutResult.url

    } catch (error: any) {
      console.error('Erro:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-6">
      
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-[400px] bg-[#131320] text-[#e5e2e9] border-[#1a1b2d]">
        <CardHeader>
          <CardTitle>Crie sua Conta</CardTitle>
          <CardDescription className="text-[#7a7b9f]">
            Digite seus dados pessoais para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 bg-[#1a1b2d] border-[#131320]"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 bg-[#1a1b2d] border-[#131320]"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <PhoneNumberInput
              id="phone"
              value={phone}
              onChange={(value) => setPhone(value)}
              required
              className="mt-1 bg-[#1a1b2d] border-[#131320]"
            />
          </div>

          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              name="city"
              type="text"
              required
              className="mt-1 bg-[#1a1b2d] border-[#131320]"
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
        
        </CardContent>
      </Card>
      <div className="text-center text-sm text-ntc-gray mt-4">
        Já tem uma conta?{" "}
        <a href="/login" className="text-ntc-purple hover:text-ntc-purple-dark underline underline-offset-4">
          Fazer login
        </a>
      </div>
    </div>
  )
}
