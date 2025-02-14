"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BusinessUser } from "@/types/user"

interface BusinessUserSelectProps {
  value: string
  onChange: (value: string) => void
}

export function BusinessUserSelect({ value, onChange }: BusinessUserSelectProps) {
  const [users, setUsers] = useState<BusinessUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users/business", {
          credentials: "include"
        })

        if (!response.ok) {
          throw new Error("Erro ao carregar usuários")
        }

        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error("Erro ao carregar usuários:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Usuário</Label>
        <div className="col-span-3 text-[#7a7b9f]">Carregando...</div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Usuário</Label>
        <div className="col-span-3 text-[#7a7b9f]">Nenhum usuário business disponível</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">Usuário</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="col-span-3 bg-[#1a1b2d] border-[#131320]">
          <SelectValue placeholder="Selecione um usuário" />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1b2d] border-[#131320]">
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id} className="text-[#e5e2e9]">
              {user.displayName} ({user.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
