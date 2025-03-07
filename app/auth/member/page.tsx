import { LoginForm } from "@/components/auth/login-form"

export default function MemberLoginPage() {
  return (
    <LoginForm
      title="Login de Assinante"
      subtitle="Entre com sua conta de Assinante para acessar o sistema"
      userType="member"
      registerUrl="/auth/register"
    />
  )
}
