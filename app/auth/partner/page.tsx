import { LoginForm } from "@/components/auth/login-form"

export default function PartnerLoginPage() {
  return (
    <LoginForm
      title="Login de Parceiro"
      subtitle="Entre com sua conta de parceiro para acessar o sistema"
      userType="partner"
      registerUrl="/auth/register"
    />
  )
}
