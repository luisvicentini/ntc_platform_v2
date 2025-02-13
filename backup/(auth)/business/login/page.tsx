import { LoginForm } from "@/components/auth/login-form"

export default function BusinessLoginPage() {
  return (
    <LoginForm
      title="Portal do Estabelecimento"
      subtitle="Gerencie seus vouchers e check-ins"
      showSocialLogin={false}
    />
  )
}

