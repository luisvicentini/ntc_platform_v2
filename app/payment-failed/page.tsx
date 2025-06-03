import { XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-800 mb-2">
          Ocorreu um problema com seu pagamento
        </h1>
        
        <p className="text-zinc-600 mb-8">
          Não foi possível confirmar seu pagamento. Isso pode acontecer por diversos motivos. Por favor, tente novamente ou entre em contato com nosso suporte.
        </p>
        
        <div className="grid gap-4">
          <Button asChild className="bg-zinc-800 hover:bg-zinc-900 w-full py-6">
            <Link href="/">
              Voltar ao início
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full py-6">
            <Link href="/support">
              Contatar suporte
            </Link>
          </Button>
        </div>
        
        <div className="mt-6 text-sm text-zinc-500">
          <p>Se você acredita que este é um erro, por favor entre em contato com nosso suporte.</p>
        </div>
      </div>
    </div>
  )
} 