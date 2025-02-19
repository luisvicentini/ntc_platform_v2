"use client"

import { useState, useCallback, useEffect } from "react"
import { useSubscription } from "@/contexts/subscription-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Badge } from "./ui/badge"
import { X, Search } from "lucide-react"
import { Input } from "./ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Partner {
  id: string
  displayName: string
  email: string
  establishmentsCount?: number
}

interface PartnerSubscription {
  id: string
  partnerId: string
  memberId: string
  status: "active" | "inactive"
  expiresAt?: string
  partner: {
    displayName: string
    email: string
  }
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
  const { addSubscriptions, getMemberSubscriptions, cancelSubscription } = useSubscription()
  const [partners, setPartners] = useState<Partner[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<PartnerSubscription[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const loadData = useCallback(async () => {
    if (!isOpen || !memberId) return

    setLoading(true)
    try {
      // Carregar assinaturas ativas
      const subscriptions = await getMemberSubscriptions(memberId)
      setActiveSubscriptions(subscriptions.filter(s => s.status === "active"))

      // Carregar todos os parceiros
      const response = await fetch("/api/partners/list")
      if (!response.ok) {
        throw new Error("Erro ao carregar parceiros")
      }
      const data = await response.json()
      console.log("Parceiros carregados:", data)
      setPartners(data)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [isOpen, memberId, getMemberSubscriptions])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddSubscription = async (partner: Partner) => {
    if (!selectedDate) {
      toast.error("Selecione uma data de expiração")
      return
    }

    try {
      await addSubscriptions(memberId, [{
        partnerId: partner.id,
        status: "active",
        expiresAt: selectedDate.toISOString()
      }])
      
      setSelectedDate(undefined) // Reset date after adding
      await loadData() // Recarrega os dados
      toast.success(`Assinatura adicionada: ${partner.displayName}`)
    } catch (error) {
      toast.error("Erro ao adicionar assinatura")
    }
  }

  const handleCancelSubscription = async (subscriptionId: string, partnerName: string) => {
    try {
      await cancelSubscription(subscriptionId)
      await loadData() // Recarrega os dados
      toast.success(`Assinatura cancelada: ${partnerName}`)
    } catch (error) {
      toast.error("Erro ao cancelar assinatura")
    }
  }

  const filteredPartners = partners.filter(partner => 
    partner.displayName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !activeSubscriptions.find(s => s.partnerId === partner.id)
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Assinaturas - {memberName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Data de Expiração */}
          <div>
            <Label>Data de Expiração</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-2",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Parceiros Disponíveis */}
          <div>
            <Label>Parceiros Disponíveis</Label>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar parceiros..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mt-2 space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : filteredPartners.length > 0 ? (
                filteredPartners.map(partner => (
                  <div 
                    key={partner.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{partner.displayName}</p>
                      <p className="text-sm text-muted-foreground">{partner.email}</p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAddSubscription(partner)}
                      disabled={!selectedDate}
                    >
                      Adicionar
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum parceiro disponível encontrado
                </p>
              )}
            </div>
          </div>

          {/* Assinaturas Ativas */}
          <div>
            <Label>Assinaturas Ativas</Label>
            <div className="mt-2 space-y-2">
              {activeSubscriptions.map(subscription => (
                <div 
                  key={subscription.id} 
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium">{subscription.partner.displayName}</p>
                    <p className="text-sm text-muted-foreground">{subscription.partner.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {subscription.expiresAt && (
                      <Badge variant="outline">
                        Expira em: {new Date(subscription.expiresAt).toLocaleDateString()}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelSubscription(subscription.id, subscription.partner.displayName)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {activeSubscriptions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma assinatura ativa
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
