"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { Establishment } from "@/types/establishment"

interface EstablishmentLinkModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
}

export function EstablishmentLinkModal({
  isOpen,
  onClose,
  userId,
  userName
}: EstablishmentLinkModalProps) {
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!isOpen || !userId) return

    setLoading(true)
    try {
      // Carregar estabelecimentos disponíveis
      const response = await fetch("/api/establishments/available")
      if (!response.ok) {
        throw new Error("Erro ao carregar estabelecimentos")
      }
      const data = await response.json()
      setEstablishments(data)

      // Carregar vínculo atual
      const userResponse = await fetch(`/api/users/${userId}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.establishmentId) {
          setSelectedEstablishment(userData.establishmentId)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [isOpen, userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!isOpen) {
      setSelectedEstablishment("")
      setEstablishments([])
    }
  }, [isOpen])

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/establishment/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          establishmentId: selectedEstablishment
        }),
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao vincular estabelecimento")
      }

      onClose()
      toast.success("Estabelecimento vinculado com sucesso")
    } catch (error) {
      console.error("Erro ao vincular estabelecimento:", error)
      toast.error("Erro ao vincular estabelecimento")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#131320] text-[#e5e2e9] border-[#1a1b2d] max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular Estabelecimento - {userName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <div>
            <Label>Estabelecimento</Label>
            <div className="mt-2">
              <Select
                value={selectedEstablishment}
                onValueChange={setSelectedEstablishment}
                disabled={loading}
              >
                <SelectTrigger className="bg-[#1a1b2d] border-[#131320]">
                  <SelectValue placeholder="Selecione um estabelecimento" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2d] border-[#131320]">
                  {establishments.map((establishment) => (
                    <SelectItem
                      key={establishment.id}
                      value={establishment.id}
                      className="text-[#e5e2e9]"
                    >
                      {establishment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="bg-[#1a1b2d] border-[#131320]">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#7435db] hover:bg-[#a85fdd] text-white"
            disabled={!selectedEstablishment || loading}
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
