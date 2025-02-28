'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const handleSuccessfulRegister = () => {
    const redirect = searchParams.get('redirect')
    if (redirect === 'onboarding') {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  // ... resto do código da página de registro ...
} 