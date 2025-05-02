"use client"

import { useState, useEffect, Suspense } from 'react'
import { CheckCircle, ArrowRight, Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

// Componente principal do conteúdo
function LastlinkSuccessContent() {
  const [emailChecked, setEmailChecked] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24">
            <Image 
              src="/logo.svg" 
              alt="Logo" 
              fill 
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Conteúdo principal */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-emerald-600 text-center">Pagamento confirmado!</h2>
          
          <p className="text-center text-zinc-600">
            Seu pagamento foi processado com sucesso! Enviamos um email com instruções para ativar sua conta.
          </p>
          
          <Card className="w-full bg-amber-50 border-amber-200">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-6 w-6 text-amber-600" />
                <h3 className="font-medium text-amber-800">Verifique seu email</h3>
              </div>
              <p className="text-amber-700 text-sm">
                Por favor, verifique sua caixa de entrada e spam pelo email de ativação.
                Você precisará criar uma senha para começar a usar a plataforma.
              </p>
              <div className="pt-2">
                <Button 
                  onClick={() => setEmailChecked(true)}
                  variant="outline"
                  className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 w-full"
                >
                  Já verifiquei meu email
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {emailChecked && (
            <div className="w-full space-y-4 pt-2">
              <p className="text-center text-zinc-600 text-sm">
                Não recebeu o email? Tente verificar sua pasta de spam ou entre em contato com nosso suporte.
              </p>
              <div className="flex space-x-4">
                <Button 
                  asChild
                  variant="outline" 
                  className="flex-1"
                >
                  <Link href="/auth/forgot-password">
                    Redefinir senha
                  </Link>
                </Button>
                <Button 
                  asChild
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Link href="/login">
                    Ir para login
                  </Link>
                </Button>
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <Link 
              href="/"
              className="text-zinc-500 hover:text-zinc-700 text-sm"
            >
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal com Suspense
export default function LastlinkSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-700">Carregando confirmação...</h2>
        </div>
      </div>
    }>
      <LastlinkSuccessContent />
    </Suspense>
  )
} 