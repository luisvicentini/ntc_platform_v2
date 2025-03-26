"use client"

import { useState, Suspense } from "react"
import { useSearchParams,useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

// Componente que usa useSearchParams
function SuccessContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const [resendingEmail, setResendingEmail] = useState(false)

  const customerEmail = searchParams.get('customer_email')
  const customerName = searchParams.get('customer_name')
  const planName = searchParams.get('plan_name')

  const handleResendEmail = async () => {
    if (!customerEmail) return

    try {
      setLoading(true)
      setResendingEmail(true)
      const response = await fetch("/api/users/resend-activation-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: customerEmail }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao reenviar email")
      }

      toast.success("Email de ativação reenviado com sucesso!")
    } catch (error: any) {
      console.error("Erro ao reenviar:", error)
      toast.error(error.message || "Erro ao reenviar email de ativação")
    } finally {
      setResendingEmail(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">
          Parabéns, {customerName}!
        </h1>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <p className="text-lg text-green-800">
            Sua assinatura do plano {planName} foi confirmada com sucesso!
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-purple-900 mb-2">
            Próximos passos
          </h2>
          <p className="text-purple-800">
            Para acessar sua conta e começar a usar os cupons, você precisa ativá-la através do link que enviamos para:
            <br />
            <span className="font-medium">{customerEmail}</span>
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            onClick={() => router.push('/login') || router.push('/member/feed')}
            size="lg"
            className="w-full bg-red-700 hover:bg-red-700"
          >
            {loading ? 'Processando...' : user?.userType === 'member' ? 'Ir para o feed de cupons' : 'Já ativou a conta? Faça login'}
          </Button>

          <Button
            onClick={handleResendEmail}
            variant="outline"
            size="lg"
            className="w-full"
            disabled={resendingEmail}
          >
            {resendingEmail ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              "Reenviar email de ativação"
            )}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Não recebeu o email? Verifique sua caixa de spam ou clique em "Reenviar email de ativação"
        </p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
} 