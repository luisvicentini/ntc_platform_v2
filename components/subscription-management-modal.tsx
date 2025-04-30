"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { useSubscription } from "@/contexts/subscription-context"
import { cn } from "@/lib/utils/utils"

interface Partner {
  id: string
  displayName: string
  email: string
}

interface LinkedPartner extends Partner {
  expirationDate: string
}

interface SubscriptionManagementModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  linkedPartners: LinkedPartner[]
}

export function SubscriptionManagementModal({
  isOpen,
  onClose,
  memberId,
  linkedPartners = []
}: SubscriptionManagementModalProps) {
  const { addSubscriptions, getMemberSubscriptions, removeSubscription } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [availablePartners, setAvailablePartners] = useState<Partner[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<LinkedPartner[]>([])
  const [newSubscriptions, setNewSubscriptions] = useState<LinkedPartner[]>([])
  const [openDatePicker, setOpenDatePicker] = useState<string | null>(null)
  const datePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchPartners = async () => {
      try {
        const response = await fetch("/api/partners/list")
        if (!response.ok) throw new Error("Erro ao carregar parceiros")
        const data = await response.json()
        
        // Filtrar parceiros que já têm assinaturas ativas
        const subscribedIds = new Set([...activeSubscriptions, ...newSubscriptions].map(p => p.id))
        const available = data.filter(partner => !subscribedIds.has(partner.id))
        setAvailablePartners(available)
      } catch (error) {
        console.error("Erro ao carregar parceiros:", error)
        toast.error("Erro ao carregar parceiros")
      }
    }

    fetchPartners()
  }, [isOpen, activeSubscriptions.length, newSubscriptions.length])

  useEffect(() => {
    const loadExistingSubscriptions = async () => {
      if (!isOpen || !memberId) return

      try {
        const subscriptions = await getMemberSubscriptions(memberId)
        const activeOnes = subscriptions
          .filter(sub => sub.status === 'active')
          .map(sub => ({
            id: sub.partnerId,
            displayName: sub.partnerName || 'Parceiro não identificado',
            email: sub.partnerEmail || '',
            expirationDate: sub.expiresAt
          }))
        
        console.log('Assinaturas ativas carregadas:', activeOnes)
        setActiveSubscriptions(activeOnes)
      } catch (error) {
        console.error("Erro ao carregar assinaturas:", error)
        toast.error("Erro ao carregar assinaturas")
      }
    }

    loadExistingSubscriptions()
  }, [isOpen, memberId, getMemberSubscriptions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setOpenDatePicker(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPartner = (partner: Partner) => {
    const defaultExpiration = new Date()
    defaultExpiration.setMonth(defaultExpiration.getMonth() + 1)

    setNewSubscriptions(prev => [...prev, {
      ...partner,
      expirationDate: defaultExpiration.toISOString()
    }])
  }

  const handleRemovePartner = (partner: LinkedPartner) => {
    setNewSubscriptions(prev => prev.filter(p => p.id !== partner.id))
  }

  const handleUpdateExpiration = (partnerId: string, date: Date) => {
    setNewSubscriptions(prev =>
      prev.map(partner =>
        partner.id === partnerId
          ? { ...partner, expirationDate: date.toISOString() }
          : partner
      )
    )
  }

  const handleRemoveActiveSubscription = async (partnerId: string) => {
    try {
      setLoading(true)
      await removeSubscription(memberId, partnerId)
      
      // Atualizar a lista de assinaturas ativas
      setActiveSubscriptions(prev => prev.filter(p => p.id !== partnerId))
      
      // Adicionar o parceiro de volta à lista de disponíveis
      const removedPartner = activeSubscriptions.find(p => p.id === partnerId)
      if (removedPartner) {
        setAvailablePartners(prev => [...prev, removedPartner])
      }
      
      toast.success("Assinatura removida com sucesso")
    } catch (error) {
      console.error("Erro ao remover assinatura:", error)
      toast.error("Erro ao remover assinatura")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const subscriptionsToAdd = newSubscriptions.map(partner => ({
        partnerId: partner.id,
        expiresAt: partner.expirationDate
      }))

      if (subscriptionsToAdd.length > 0) {
        await addSubscriptions(memberId, subscriptionsToAdd)
        toast.success("Assinaturas adicionadas com sucesso")
      }
      onClose()
    } catch (error) {
      console.error("Erro ao salvar assinaturas:", error)
      toast.error("Erro ao salvar assinaturas")
    } finally {
      setLoading(false)
    }
  }

  const DatePickerDropdown = ({ partner, onSelect }: { 
    partner: LinkedPartner, 
    onSelect: (date: Date) => void 
  }) => {
    const isOpen = openDatePicker === partner.id

    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenDatePicker(isOpen ? null : partner.id)}
          className="text-xs bg-transparent w-full justify-start bg-zinc-100 border-0 hover:bg-white hover:text-zinc-500"
        >
          <CalendarIcon className="h-3 w-3 mr-1" />
          Data de Expiração: {format(new Date(partner.expirationDate), "dd/MM/yyyy", { locale: ptBR })}
        </Button>
        
        {isOpen && (
          <div 
            ref={datePickerRef}
            className="absolute z-50 mt-1 bg-zinc-100 rounded-md shadow-lg"
          >
            <Calendar
              mode="single"
              selected={new Date(partner.expirationDate)}
              onSelect={(date) => {
                if (date) {
                  onSelect(date)
                  setOpenDatePicker(null)
                }
              }}
              disabled={(date) => date < new Date()}
              initialFocus
              className="bg-zinc-100 rounded-md"
            />
          </div>
        )}
      </>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-zinc-100 text-zinc-500 p-0">
        <DialogHeader className="p-6 border-b border-zinc-200">
          <DialogTitle className="text-xl font-semibold">Vincular Assinante a uma assinatura de parceiro</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Coluna 1: Parceiros Disponíveis */}
          <div>
            <Label className="text-zinc-500 mb-2">Parceiros Disponíveis</Label>
            <Input
              placeholder="Buscar parceiro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4 bg-zinc-100 text-zinc-500 border-zinc-200 placeholder:text-zinc-300"
            />
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availablePartners
                .filter(partner => 
                  partner.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center justify-between p-3 bg-zinc-200 rounded-lg"
                  >
                    <span>{partner.displayName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectPartner(partner)}
                      className="text-zinc-500 hover:bg-zinc-200 hover:text-zinc-500"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          {/* Coluna 2: Assinaturas */}
          <div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {/* Assinaturas Ativas */}
              {activeSubscriptions.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-500">Assinaturas Ativas</Label>
                  {activeSubscriptions.map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between p-3 bg-zinc-200 rounded-lg"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-500">{partner.displayName}</span>
                        <span className="text-xs text-zinc-400 bg-zinc-100 border-0 hover:bg-white hover:text-zinc-500 rounded-md px-2 py-1">
                          Expira em: {format(new Date(partner.expirationDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveActiveSubscription(partner.id)}
                        className="text-red-500 hover:bg-zinc-200 hover:text-zinc-500"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-zinc-300 py-4">
                  Nenhuma assinatura ativa
                </div>
              )}

              {/* Novas Assinaturas */}
              {newSubscriptions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-500">Novas Assinaturas</Label>
                  {newSubscriptions.map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between p-3 bg-zinc-200 rounded-lg"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <span className="text-zinc-500">{partner.displayName}</span>
                        <DatePickerDropdown
                          partner={partner}
                          onSelect={(date) => handleUpdateExpiration(partner.id, date)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePartner(partner)}
                        className="text-red-500 hover:bg-zinc-200 hover:text-zinc-500"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-zinc-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-zinc-300 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-500"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || newSubscriptions.length === 0}
            className="bg-primary hover:bg-secondary text-white"
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
