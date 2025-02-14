"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, X } from "lucide-react"
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
  const { addSubscriptions, getMemberSubscriptions } = useSubscription()
  const [partners, setPartners] = useState<Partner[]>([])
  const [selectedPartners, setSelectedPartners] = useState<(Partner & { expiresAt?: Date })[]>([])
  const [loading, setLoading] = useState(false)

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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal bg-[#1a1b2d] border-[#131320] hover:bg-[#1a1b2d]/80",
                            !partner.expiresAt && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {partner.expiresAt ? (
                            format(partner.expiresAt, "PPP", { locale: ptBR })
                          ) : (
                            "Definir data de expiração"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-auto p-0 bg-[#1a1b2d] border-[#131320]">
                        <div className="p-3">
                          <CalendarComponent
                            mode="single"
                            selected={partner.expiresAt}
                            onSelect={(date) => handleDateSelect(partner.id, date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            locale={ptBR}
                            className="rounded-md border border-[#1a1b2d]"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedPartners(prev => prev.filter(p => p.id !== partner.id))}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
