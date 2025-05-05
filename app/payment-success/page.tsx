import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-800 mb-2">
          Pagamento realizado com sucesso!
        </h1>
        
        <p className="text-zinc-600 mb-8">
          Seu pagamento foi confirmado e sua assinatura está ativa. Agora você pode acessar todos os benefícios do seu plano.
        </p>
        
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 w-full py-6">
          <Link href="/member/feed">
            Ir para minha conta
          </Link>
        </Button>
        
        <div className="mt-6 text-sm text-zinc-500">
          <p>Se precisar de ajuda, entre em contato com nosso suporte.</p>
        </div>
      </div>
    </div>
  )
} 