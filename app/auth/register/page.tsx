'use client'

import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { RegisterFormWrapper } from '@/components/auth/register-form-wrapper'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RegisterFormWrapper />
    </Suspense>
  )
}
