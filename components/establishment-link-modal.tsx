"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { ChevronRight, Trash } from "lucide-react"
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
  const [availableEstablishments, setAvailableEstablishments] = useState<Establishment[]>([])
  const [selectedEstablishments, setSelectedEstablishments] = useState<Establishment[]>([])
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!isOpen || !userId) return

    setLoading(true)
    try {
      // Carregar estabelecimentos disponíveis
      const response = await fetch("/api/establishments/available", {
        headers: {
          "x-session-token": localStorage.getItem("sessionToken") || "",
        },
      })
      if (!response.ok) {
        throw new Error("Erro ao carregar estabelecimentos")
      }
      const availableData = await response.json()
      
      // Carregar dados do usuário
      const userResponse = await fetch(`/api/users/${userId}`, {
        headers: {
          "x-session-token": localStorage.getItem("sessionToken") || "",
        },
      })
      
      if (!userResponse.ok) {
        throw new Error("Erro ao carregar dados do usuário")
      }
      
      const userData = await userResponse.json()
      
      // Inicializar todos os estabelecimentos como disponíveis
      let availableEstablishments = [...availableData]
      let selectedEstabs: typeof availableData = []

      // Se o usuário já tem estabelecimentos vinculados
      if (userData.establishmentIds?.length > 0 || userData.establishmentId) {
        const linkedIds = userData.establishmentIds || [userData.establishmentId]
        
        // Separar estabelecimentos vinculados e disponíveis
        selectedEstabs = availableData.filter(est => linkedIds.includes(est.id))
        availableEstablishments = availableData.filter(est => !linkedIds.includes(est.id))
      }

      setAvailableEstablishments(availableEstablishments)
      setSelectedEstablishments(selectedEstabs)

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
      setSelectedToAdd([])
      setSelectedEstablishments([])
    }
  }, [isOpen])

  const handleAddSelected = () => {
    const establishmentsToAdd = availableEstablishments.filter(est => 
      selectedToAdd.includes(est.id)
    )
    setSelectedEstablishments(prev => [...prev, ...establishmentsToAdd])
    setSelectedToAdd([])
  }

  const handleRemoveEstablishment = async (establishmentId: string) => {
    try {
      setLoading(true)
      
      // Remover o estabelecimento da lista atual
      const updatedSelected = selectedEstablishments.filter(est => est.id !== establishmentId)
      
      // Adicionar o estabelecimento removido de volta à lista de disponíveis
      const removedEstablishment = selectedEstablishments.find(est => est.id === establishmentId)
      if (removedEstablishment) {
        setAvailableEstablishments(prev => [...prev, removedEstablishment])
      }

      // Atualizar no banco de dados
      const response = await fetch(`/api/users/${userId}/establishment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": localStorage.getItem("sessionToken") || "",
        },
        body: JSON.stringify({
          establishmentIds: updatedSelected.map(est => est.id),
          removeAll: updatedSelected.length === 0 // Indica se está removendo todos
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao remover estabelecimento")
      }

      // Atualizar o estado local apenas se a requisição for bem-sucedida
      setSelectedEstablishments(updatedSelected)
      toast.success("Estabelecimento removido com sucesso")

    } catch (error) {
      console.error("Erro ao remover estabelecimento:", error)
      toast.error("Erro ao remover estabelecimento")
      
      // Reverter mudanças locais em caso de erro
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/users/${userId}/establishment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": localStorage.getItem("sessionToken") || "",
        },
        body: JSON.stringify({
          establishmentIds: selectedEstablishments.map(est => est.id)
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar estabelecimentos")
      }

      toast.success("Estabelecimentos salvos com sucesso")
      onClose()

    } catch (error) {
      console.error("Erro ao salvar estabelecimentos:", error)
      toast.error("Erro ao salvar estabelecimentos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-100 text-zinc-500 border-zinc-200 max-w-4xl">
        <DialogHeader>
          <DialogTitle>Vincular Estabelecimentos - {userName}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Coluna 1 - Estabelecimentos Disponíveis */}
          <div className="space-y-4">
            <Label>Estabelecimentos Disponíveis</Label>
            <div className="border border-zinc-200 rounded-md p-4 h-[300px] overflow-y-auto">
              {availableEstablishments
                .filter(est => !selectedEstablishments.some(s => s.id === est.id))
                .map((establishment) => (
                  <div key={establishment.id} className="flex items-center space-x-2 py-2">
                    <Checkbox
                      checked={selectedToAdd.includes(establishment.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedToAdd(prev => [...prev, establishment.id])
                        } else {
                          setSelectedToAdd(prev => prev.filter(id => id !== establishment.id))
                        }
                      }}
                    />
                    <span>{establishment.name}</span>
                  </div>
                ))}
            </div>
            <Button
              onClick={handleAddSelected}
              disabled={selectedToAdd.length === 0}
              className="w-full text-white"
            >
              Adicionar Selecionados <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Coluna 2 - Estabelecimentos Selecionados */}
          <div className="space-y-4">
            <Label>Estabelecimentos Selecionados</Label>
            <div className="border border-zinc-200 rounded-md p-4 h-[300px] overflow-y-auto">
              {selectedEstablishments.map((establishment) => (
                <div key={establishment.id} className="flex items-center justify-between py-2">
                  <span>{establishment.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEstablishment(establishment.id)}
                    disabled={loading}
                    className="text-red-500 hover:bg-zinc-200 hover:text-red-600"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="bg-zinc-100 border-zinc-200"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-secondary text-white"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 