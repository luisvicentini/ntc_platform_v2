import { LoginForm } from "@/components/auth/login-form"

export default function PartnerLoginPage() {
  return (
    <LoginForm
      title="Portal do Parceiro"
      subtitle="Gerencie seus estabelecimentos e assinaturas"
      showSocialLogin={false}
    />
  )
}

