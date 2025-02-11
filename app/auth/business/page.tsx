import { LoginForm } from "@/components/auth/login-form"

export default function BusinessLoginPage() {
  return (
    <LoginForm
      title="Login de Estabelecimento"
      subtitle="Entre com sua conta de estabelecimento para acessar o sistema"
      userType="business"
      registerUrl="/auth/register"
    />
  )
}
