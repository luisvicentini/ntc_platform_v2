"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { UserProfile } from "@/types/user"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: UserProfile | null
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    userType: "member",
    status: "active"
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName,
        email: user.email,
        userType: user.userType,
        status: user.status
      })
    } else {
      setFormData({
        displayName: "",
        email: "",
        userType: "member",
        status: "active"
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const url = user ? `/api/users/${user.id}` : "/api/users"
      const method = user ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar usuário")
      }

      toast.success(user ? "Usuário atualizado com sucesso" : "Usuário criado com sucesso")
      onClose()
    } catch (error) {
      console.error("Erro ao salvar usuário:", error)
      toast.error("Erro ao salvar usuário")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#131320] text-[#e5e2e9] border-[#1a1b2d] max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <div>
            <Label>Nome</Label>
            <Input
              value={formData.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)}
              className="mt-2 bg-[#1a1b2d] border-[#131320]"
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="mt-2 bg-[#1a1b2d] border-[#131320]"
            />
          </div>

          <div>
            <Label>Função</Label>
            <Select
              value={formData.userType}
              onValueChange={(value) => handleChange("userType", value)}
              disabled={!!user}
            >
              <SelectTrigger className="mt-2 bg-[#1a1b2d] border-[#131320]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2d] border-[#131320]">
                <SelectItem value="member" className="text-[#e5e2e9]">Membro</SelectItem>
                <SelectItem value="business" className="text-[#e5e2e9]">Estabelecimento</SelectItem>
                <SelectItem value="partner" className="text-[#e5e2e9]">Parceiro</SelectItem>
                <SelectItem value="master" className="text-[#e5e2e9]">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {user && (
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger className="mt-2 bg-[#1a1b2d] border-[#131320]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2d] border-[#131320]">
                  <SelectItem value="active" className="text-[#e5e2e9]">Ativo</SelectItem>
                  <SelectItem value="inactive" className="text-[#e5e2e9]">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-[#1a1b2d] border-[#131320]">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#7435db] hover:bg-[#a85fdd] text-white"
            disabled={loading}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
