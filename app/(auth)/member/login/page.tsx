import { LoginForm } from "@/components/auth/login-form"

export default function MemberLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ntc-purple to-ntc-purple-dark p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <LoginForm title="Entrar como Membro" subtitle="Entre com seu e-mail para ter acesso ao sistema" />
      </div>
    </div>
  )
}

