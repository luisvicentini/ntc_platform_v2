import { LoginForm } from "@/components/auth/login-form"

export default function MemberLoginPage() {
  return (
    <LoginForm
      title="Login de Membro"
      subtitle="Entre com sua conta de membro para acessar o sistema"
      userType="member"
      registerUrl="/auth/register"
    />
  )
}
