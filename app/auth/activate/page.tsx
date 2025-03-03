"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export default function ActivateAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false,
    lowercase: false,
  })
  const [passwordsMatch, setPasswordsMatch] = useState(true)

  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
    })
  }, [password])

  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword)
    }
  }, [password, confirmPassword])

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error("Token de ativação inválido")
      return
    }

    if (!isPasswordValid) {
      toast.error("A senha não atende aos requisitos mínimos")
      return
    }

    if (!passwordsMatch) {
      toast.error("As senhas não coincidem")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/users/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao ativar conta")
      }

      const { userType } = data
      toast.success("Conta ativada com sucesso!")
      
      // Redirecionar para a página de login correta baseada no userType
      const loginPath = userType === "member" 
        ? "/auth/member" 
        : userType === "partner"
        ? "/auth/partner"
        : userType === "business"
        ? "/auth/business"
        : userType === "master"
        ? "/auth/master"
        : "/auth/member"
      
      router.push(loginPath)

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-6">
        <div className="mb-8">
          <Logo />
        </div>
        <Card className="w-[400px] bg-[#131320] text-[#e5e2e9] border-[#1a1b2d]">
          <CardHeader>
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription className="text-[#7a7b9f]">
              O link de ativação é inválido ou expirou.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-6">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-[400px] bg-[#131320] text-[#e5e2e9] border-[#1a1b2d]">
        <CardHeader>
          <CardTitle>Ative sua Conta</CardTitle>
          <CardDescription className="text-[#7a7b9f]">
            Defina sua senha para ativar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Requisitos da senha:</Label>
                <ul className="text-sm space-y-1">
                  <li className={passwordValidation.length ? "text-green-500" : "text-[#7a7b9f]"}>
                    • Mínimo de 8 caracteres
                  </li>
                  <li className={passwordValidation.number ? "text-green-500" : "text-[#7a7b9f]"}>
                    • Pelo menos um número
                  </li>
                  <li className={passwordValidation.special ? "text-green-500" : "text-[#7a7b9f]"}>
                    • Pelo menos um caractere especial
                  </li>
                  <li className={passwordValidation.uppercase ? "text-green-500" : "text-[#7a7b9f]"}>
                    • Pelo menos uma letra maiúscula
                  </li>
                  <li className={passwordValidation.lowercase ? "text-green-500" : "text-[#7a7b9f]"}>
                    • Pelo menos uma letra minúscula
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`bg-[#1a1b2d] border-[#131320] ${!password || isPasswordValid ? "" : "border-red-500"}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-[#7a7b9f] hover:text-[#e5e2e9]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirme a Senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`bg-[#1a1b2d] border-[#131320] ${!confirmPassword || passwordsMatch ? "" : "border-red-500"}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-[#7a7b9f] hover:text-[#e5e2e9]"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-red-500">As senhas não coincidem</p>
                )}
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#7435db] hover:bg-[#7435db]/80"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ativando...
                </>
              ) : (
                "Ativar Conta"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
