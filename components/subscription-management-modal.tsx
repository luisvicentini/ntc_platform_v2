"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, X, MoreVertical } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useSubscription } from "@/contexts/subscription-context"
import { toast } from "sonner"
import { PartnerCombobox } from "./partner-combobox"
import type { PartnerSubscription } from "@/types/subscription"

interface Partner {
  id: string
  displayName: string
  email: string
}

interface SubscriptionManagementModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
}

export function SubscriptionManagementModal({ 
  isOpen, 
  onClose, 
  memberId,
  memberName 
}: SubscriptionManagementModalProps) {
  const { addSubscriptions, getMemberSubscriptions, removeSubscription } = useSubscription()
  const [partners, setPartners] = useState<Partner[]>([])
  const [selectedPartners, setSelectedPartners] = useState<(Partner & { expiresAt?: Date })[]>([])
  const [loading, setLoading] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!isOpen || !memberId) return

    setLoading(true)
    try {
      // Carregar assinaturas existentes
      const subscriptions = await getMemberSubscriptions(memberId) as PartnerSubscription[]
      const existingPartners = subscriptions
        .filter(s => s.status === "active")
        .map(s => ({
          id: s.partnerId,
          displayName: s.partner.displayName,
          email: s.partner.email,
          expiresAt: s.expiresAt ? new Date(s.expiresAt) : undefined
        }))
      setSelectedPartners(existingPartners)

      // Carregar parceiros disponíveis
      const response = await fetch("/api/partners/list")
      if (!response.ok) {
        throw new Error("Erro ao carregar parceiros")
      }
      const data = await response.json()
      setPartners(data)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [isOpen, memberId, getMemberSubscriptions])

  // Carregar dados quando o modal abrir
  useEffect(() => {
    loadData()
  }, [loadData])

  // Limpar dados quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      setSelectedPartners([])
      setPartners([])
    }
  }, [isOpen])

  const handlePartnerSelect = (partner: Partner) => {
    if (!selectedPartners.find(p => p.id === partner.id)) {
      setSelectedPartners([...selectedPartners, partner])
    }
  }

  const handleDateSelect = (partnerId: string, date: Date | undefined) => {
    setSelectedPartners(prev => 
      prev.map(partner => 
        partner.id === partnerId 
          ? { ...partner, expiresAt: date }
          : partner
      )
    )
  }

  const handleRemovePartner = async (partnerId: string) => {
    try {
      setLoading(true)
      await removeSubscription(memberId, partnerId)
      setSelectedPartners(prev => prev.filter(p => p.id !== partnerId))
      toast.success("Parceiro removido com sucesso")
    } catch (error) {
      console.error("Erro ao remover parceiro:", error)
      toast.error("Erro ao remover parceiro")
    } finally {
      setLoading(false)
      setOpenDropdownId(null)
    }
  }

  const handleSave = async () => {
    try {
      const subscriptionsData = selectedPartners.map(partner => ({
        partnerId: partner.id,
        expiresAt: partner.expiresAt?.toISOString()
      }))

      await addSubscriptions(memberId, subscriptionsData)
      onClose()
      toast.success("Assinaturas atualizadas com sucesso")
    } catch (error) {
      console.error("Erro ao salvar assinaturas:", error)
      toast.error("Erro ao salvar assinaturas")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#131320] text-[#e5e2e9] border-[#1a1b2d] max-w-5xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Assinaturas - {memberName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Adicionar Parceiro */}
          <div>
            <Label>Adicionar Parceiro</Label>
            <div className="mt-2">
              <PartnerCombobox 
                partners={partners.filter(p => !selectedPartners.find(sp => sp.id === p.id))}
                onSelect={handlePartnerSelect}
              />
            </div>
          </div>

          {/* Parceiros Selecionados */}
          <div>
            <Label>Parceiros Vinculados</Label>
            <div className="mt-2 space-y-2">
              {selectedPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-[#1a1b2d] p-4 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-medium">{partner.displayName}</h4>
                    <p className="text-sm text-[#7a7b9f]">{partner.email}</p>
                    {partner.expiresAt && (
                      <p className="text-sm text-[#7a7b9f]">
                        Expira em: {format(partner.expiresAt, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpenDropdownId(openDropdownId === partner.id ? null : partner.id)}
                        className="relative z-10"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {openDropdownId === partner.id && (
                        <div className="absolute right-0 top-full mt-1 min-w-[200px] rounded-md bg-[#1a1b2d] p-2 shadow-md border border-[#131320] z-50">
                          <div className="flex flex-col space-y-1">
                            <button
                              className="text-left px-2 py-1.5 text-sm text-[#e5e2e9] hover:bg-[#131320] rounded-sm flex items-center"
                              onClick={() => setOpenCalendarId(partner.id)}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Data de Expiração
                            </button>
                            <button
                              className="text-left px-2 py-1.5 text-sm text-red-500 hover:bg-[#131320] rounded-sm flex items-center"
                              onClick={() => handleRemovePartner(partner.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remover
                            </button>
                          </div>
                        </div>
                      )}

                      {openCalendarId === partner.id && (
                        <div className="absolute right-0 top-full mt-1 rounded-md bg-[#1a1b2d] p-3 shadow-md border border-[#131320] z-50">
                          <CalendarComponent
                            mode="single"
                            selected={partner.expiresAt}
                            onSelect={(date) => {
                              handleDateSelect(partner.id, date)
                              setOpenCalendarId(null)
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            locale={ptBR}
                            className="rounded-md border border-[#1a1b2d]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="text-center text-[#7a7b9f] py-4">
                  Carregando...
                </div>
              )}

              {!loading && selectedPartners.length === 0 && (
                <div className="text-center text-[#7a7b9f] py-4">
                  Nenhum parceiro vinculado
                </div>
              )}
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
            disabled={selectedPartners.length === 0 || loading}
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
