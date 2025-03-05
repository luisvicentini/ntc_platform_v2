'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSuccessfulRegister = async (userData: any, sessionToken: string) => {
    const redirect = searchParams.get('redirect')
    
    if (redirect === 'onboarding') {
      try {
        setLoading(true)
        
        // Criar sessão de checkout usando o token de sessão
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            userId: userData.id,
            email: userData.email,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
            partnerId: searchParams.get('partnerId') || undefined,
            partnerLinkId: searchParams.get('ref') || undefined
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao criar sessão de checkout')
        }

        const { url } = await response.json()
        if (url) {
          window.location.href = url
        } else {
          throw new Error('URL de checkout não encontrada')
        }
      } catch (error) {
        console.error('Erro no redirecionamento:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <RegisterForm 
      onSuccess={handleSuccessfulRegister}
      loading={loading}
    />
  )
}
