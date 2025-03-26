"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { X } from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ManageSubscriptionsProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
}

export function ManageSubscriptions({ isOpen, onClose, memberId, memberName }: ManageSubscriptionsProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const { subscriptions, addSubscriptions, cancelSubscription, getMemberSubscriptions } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null)

  // Carregar assinaturas ao abrir o modal
  useEffect(() => {
    if (isOpen && memberId) {
      loadSubscriptions()
    }
  }, [isOpen, memberId])

  const loadSubscriptions = async () => {
    try {
      await getMemberSubscriptions(memberId)
    } catch (error) {
      console.error("Erro ao carregar assinaturas:", error)
      toast.error("Erro ao carregar assinaturas")
    }
  }

  const handleAddSubscription = async () => {
    if (!selectedPartnerId) {
      toast.error("Selecione um parceiro")
      return
    }

    try {
      setLoading(true)
      await addSubscriptions(memberId, [{
        partnerId: selectedPartnerId,
        expiresAt: expiresAt || undefined
      }])
      await loadSubscriptions()
      setSelectedPartnerId("")
      setExpiresAt("")
      toast.success("Assinatura adicionada com sucesso")
    } catch (error) {
      console.error("Erro ao adicionar assinatura:", error)
      toast.error("Erro ao adicionar assinatura")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (subscriptionId: string) => {
    setSubscriptionToDelete(subscriptionId)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!subscriptionToDelete) return

    try {
      setLoading(true)
      await cancelSubscription(subscriptionToDelete)
      await loadSubscriptions()
      toast.success("Assinatura removida com sucesso")
    } catch (error) {
      console.error("Erro ao remover assinatura:", error)
      toast.error("Erro ao remover assinatura")
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
      setSubscriptionToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
    setSubscriptionToDelete(null)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-zinc-100 text-white border-zinc-200">
          <DialogHeader>
            <DialogTitle>Gerenciar Assinaturas - {memberName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um parceiro..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Adicione seus parceiros aqui */}
                  <SelectItem value="partner1">Parceiro 1</SelectItem>
                  <SelectItem value="partner2">Parceiro 2</SelectItem>
                </SelectContent>
              </Select>

              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-zinc-100 border border-[#2e2e3d] rounded-md px-3 py-2"
              />

              <Button onClick={handleAddSubscription} disabled={loading}>
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400">Parceiros Vinculados</h3>
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="bg-zinc-100 p-4 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-zinc-500">{subscription.partnerName}</p>
                    <p className="text-sm text-zinc-400">
                      Expira em: {subscription.expiresAt 
                        ? format(new Date(subscription.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "Sem data"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(subscription.id)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-100 text-white border-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja remover esta assinatura? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleCancelDelete}
              className="bg-zinc-100 text-white hover:bg-zinc-100"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 