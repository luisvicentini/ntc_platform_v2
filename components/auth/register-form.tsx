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

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState("")
  
  // Verifica se está vindo de um checkout do Lastlink
  const isLastlinkCheckout = searchParams.get('checkout') === 'lastlink'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const userData = {
        email: formData.get("email") as string,
        displayName: formData.get("name") as string,
        phoneNumber: phone,
        city: formData.get("city") as string,
        userType: "member"
      }

      // 1. Criar a conta do usuário
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        setError(registerData.error || "Erro ao criar conta")
        return // Importante: retornar aqui para não continuar o processo
      }

      console.log('Registro bem sucedido:', registerData)

      // 2. Recuperar dados do checkout do localStorage
      const checkoutData = localStorage.getItem('checkoutData')
      if (!checkoutData) {
        console.error('Dados do checkout não encontrados')
        toast.error("Erro ao recuperar dados do plano")
        router.push('/')
        return
      }

      let parsedCheckoutData
      try {
        parsedCheckoutData = JSON.parse(checkoutData)
        console.log('Dados do checkout recuperados:', parsedCheckoutData)
      } catch (e) {
        console.error('Erro ao parsear dados do checkout:', e)
        toast.error("Erro ao processar dados do plano")
        router.push('/')
        return
      }
      
      // Verificar o tipo de checkout (Stripe ou Lastlink)
      const checkoutType = parsedCheckoutData.checkoutType || 
                           (isLastlinkCheckout ? 'lastlink' : 'stripe') ||
                           (parsedCheckoutData.priceId?.startsWith('lastlink_') ? 'lastlink' : 'stripe')
      
      console.log('Tipo de checkout identificado:', checkoutType)
      
      if (checkoutType === 'lastlink') {
        // 3A. Redirecionar para o Lastlink
        console.log('Redirecionando para o Lastlink')
        
        // Definir URL de callback
        const callbackUrl = `${window.location.origin}/api/lastlink/callback`
        
        // Buscar URL de redirecionamento do Lastlink
        const lastlinkResponse = await fetch(`/api/lastlink/redirect?linkId=${parsedCheckoutData.partnerLinkId}&userId=${registerData.user.id}&callback=${encodeURIComponent(callbackUrl)}`, {
          method: 'GET',
          credentials: 'include'
        })
        
        const lastlinkData = await lastlinkResponse.json()
        
        if (!lastlinkResponse.ok || !lastlinkData.redirectUrl) {
          setError(lastlinkData.error || "Erro ao obter URL de redirecionamento")
          return
        }
        
        // 4A. Limpar dados e redirecionar
        localStorage.removeItem('checkoutData')
        toast.success("Redirecionando para o pagamento...")
        window.location.href = lastlinkData.redirectUrl
      } else {
        // 3B. Criar a sessão de checkout no Stripe
        const stripeResponse = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: parsedCheckoutData.priceId,
            partnerId: parsedCheckoutData.partnerId,
            partnerLinkId: parsedCheckoutData.partnerLinkId,
            email: userData.email,
            customer_data: {
              email: userData.email,
              phone: phone,
              name: userData.displayName
            },
            planName: parsedCheckoutData.planName,
            userId: registerData.user.id
          }),
          credentials: 'include'
        })

        const stripeData = await stripeResponse.json()

        if (!stripeResponse.ok) {
          setError(stripeData.error || "Erro ao criar sessão de pagamento")
          return
        }

        // 4B. Limpar dados e redirecionar
        localStorage.removeItem('checkoutData')
        toast.success("Redirecionando para o pagamento...")
        window.location.href = stripeData.url
      }

    } catch (error: any) {
      console.error("Erro detalhado:", error)
      setError(error.message || "Erro ao processar registro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-6">
      
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-[400px] bg-zinc-50 text-zinc-500 border-zinc-200">
        <CardHeader>
          <CardTitle>Crie sua Conta</CardTitle>
          <CardDescription className="text-zinc-400">
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
              className="mt-1 border-zinc-200"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 border-zinc-200"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <PhoneNumberInput
              id="phone"
              value={phone}
              onChange={(value) => setPhone(value)}
              required
              className="mt-1 border-zinc-200"
            />
          </div>

          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              name="city"
              type="text"
              required
              className="mt-1 border-zinc-200"
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
      <div className="text-center text-sm text-zinc-500 mt-4">
        Já tem uma conta?{" "}
        <a href="/login" className="text-custom-primary hover:text-custom-primary-dark underline underline-offset-4">
          Fazer login
        </a>
      </div>
    </div>
  )
}
