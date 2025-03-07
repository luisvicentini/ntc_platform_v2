"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PhoneNumberInput } from "@/components/ui/phone-input"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    city: ""
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const response = await fetch(`/api/user/profile?userId=${user.uid}`)
          if (response.ok) {
            const data = await response.json()
            console.log('Dados do perfil:', data) // Para debug
            
            setProfile({
              name: data.displayName || user.displayName || "",
              email: data.email || user.email || "",
              phone: data.phoneNumber || data.phone || user.phoneNumber || "", // Adicionado data.phone como fallback
              city: data.city || "",
            })
          } else {
            console.error("Erro ao buscar perfil:", response.statusText)
          }
        } catch (error) {
          console.error("Erro ao buscar perfil:", error)
        }
      }
    }

    fetchProfile()
  }, [user])

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.uid,
          displayName: profile.name,
          phoneNumber: profile.phone,
          city: profile.city,
          photoURL: user?.photoURL,
          email: user?.email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const result = await response.json()
      
      if (result.success) {
        // Atualizar o estado local
        setIsEditing(false)
        
        // Forçar revalidação dos dados
        router.refresh()
        
        // Recarregar a página para garantir que todos os componentes sejam atualizados
        window.location.reload()
      } else {
        throw new Error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Erro ao atualizar perfil. Tente novamente.")
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <Card className="bg-[#131320] border-[#1a1b2d]">
        <CardHeader>
          <CardTitle className="text-[#e5e2e9]">Meu Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage 
            src={user?.photoURL || undefined} 
            alt={user?.displayName || "User"}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        {isEditing && (
          <>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file && user?.uid) {
                  try {
                    // Verificar o tamanho do arquivo (máximo 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      alert("A imagem deve ter no máximo 5MB")
                      return
                    }

                    // Verificar o tipo do arquivo
                    if (!file.type.startsWith('image/')) {
                      alert("O arquivo deve ser uma imagem")
                      return
                    }

                    // Converter a imagem para base64
                    const reader = new FileReader()
                    reader.onload = async (event) => {
                      try {
                        const base64 = event.target?.result as string
                        console.log('Imagem convertida para base64')
                        
                        // Fazer o upload da imagem
                        console.log('Iniciando upload...')
                        const response = await fetch("/api/user/profile/upload", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            userId: user.uid,
                            imageBase64: base64,
                          }),
                        })

                        const result = await response.json()
                        
                        if (!response.ok) {
                          throw new Error(result.details || "Erro ao fazer upload da imagem")
                        }

                        if (result.success) {
                          console.log('Upload concluído com sucesso')
                          // Forçar revalidação dos dados
                          router.refresh()
                          
                          // Recarregar a página para atualizar a imagem
                          window.location.reload()
                        }
                      } catch (error: any) {
                        console.error("Erro detalhado:", error)
                        alert(error.message || "Erro ao fazer upload da imagem. Tente novamente.")
                      }
                    }

                    reader.onerror = () => {
                      console.error("Erro ao ler o arquivo")
                      alert("Erro ao processar a imagem. Tente novamente.")
                    }

                    console.log('Iniciando leitura do arquivo...')
                    reader.readAsDataURL(file)
                  } catch (error) {
                    console.error("Erro ao processar imagem:", error)
                    alert("Erro ao processar a imagem. Tente novamente.")
                  }
                }
              }}
            />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-1 rounded-full bg-[#7435db] hover:bg-[#a85fdd] cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </label>
          </>
        )}
      </div>
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancelar" : "Editar Perfil"}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={profile.name}
                disabled={!isEditing}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="bg-[#1a1b2d] border-[#131320] text-[#e5e2e9]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled={true}
                className="bg-[#1a1b2d] border-[#131320] text-[#e5e2e9] opacity-50"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <PhoneNumberInput
                defaultCountry="BR"
                value={profile.phone}
                onChange={(value) => setProfile({ ...profile, phone: value || "" })}
                disabled={!isEditing}
                className="bg-[#1a1b2d] text-[#e5e2e9]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={profile.city}
                disabled={!isEditing}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="bg-[#1a1b2d] border-[#131320] text-[#e5e2e9]"
              />
            </div>

            {isEditing && (
              <Button 
                className="w-full bg-[#7435db] hover:bg-[#a85fdd] text-white"
                onClick={handleSave}
              >
                Salvar Alterações
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
