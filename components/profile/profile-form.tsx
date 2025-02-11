"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { UpdateUserProfileData } from "@/types/user"

export function ProfileForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    phoneNumber: user?.phoneNumber || "",
    bio: "",
    photoURL: user?.photoURL || ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const updateData: UpdateUserProfileData = {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        photoURL: formData.photoURL
      }

      // Atualizar através da API
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          ...updateData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      // Revalidar a página e atualizar o contexto
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={formData.photoURL || undefined} />
            <AvatarFallback>{formData.displayName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="photoURL">URL da Foto</Label>
            <Input
              id="photoURL"
              value={formData.photoURL}
              onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
              className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]"
              placeholder="https://exemplo.com/foto.jpg"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Nome</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Telefone</Label>
        <Input
          id="phoneNumber"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Biografia</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <Button 
        type="submit" 
        className="bg-[#7435db] hover:bg-[#5f2bb3] text-white"
        disabled={loading}
      >
        {loading ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  )
}
