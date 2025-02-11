import { LoginForm } from "@/components/auth/login-form"

export default function MasterLoginPage() {
  return (
    <LoginForm
      title="Login Administrativo"
      subtitle="Entre com sua conta administrativa para acessar o sistema"
      userType="master"
      registerUrl="/auth/register"
      showSocialLogin={false} // Desabilita login social para administradores
    />
  )
}
