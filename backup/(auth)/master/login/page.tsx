import { LoginForm } from "@/components/auth/login-form"

export default function MasterLoginPage() {
  return (
    <LoginForm
      title="Área Administrativa"
      subtitle="Acesso restrito para administradores do sistema"
      showSocialLogin={false}
      registerUrl={undefined}
    />
  )
}

